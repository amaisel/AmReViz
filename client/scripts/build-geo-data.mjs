// Builds accurate period-map geometry for the parchment chart.
//
// Sources:
//   - us-atlas states-10m (TopoJSON, accurate US state coasts)
//   - world-atlas countries-50m (Canada and neighbors)
//   - world-atlas countries-110m (Western Europe, the far shore of the crossing)
//   - Natural Earth 50m lakes and river centerlines
//
// Outputs (ES modules under src/data/geo/):
//   - colonyShapes.js   accurate colony geometries keyed by colony name
//   - baseMap.js        land silhouette, lakes, rivers clipped to the chart
//                       bounds, plus a coarse European coast for the Atlantic frame
//
// Run: node scripts/build-geo-data.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as topojson from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'geo');

// Chart bounds with generous margin beyond the Leaflet maxBounds
// [27,-91]..[48,-60] so the data edge stays off-screen even on wide
// monitors at minZoom.
const BOUNDS = { west: -95.0, south: 23.0, east: -52.0, north: 52.0 };

// The land silhouette alone runs wider. At minZoom on a wide display the
// viewport is wider than maxBounds, so Leaflet cannot clamp the pan and the
// clipper's straight cut showed as a false coastline down the left of the
// chart — the margin has to beat the viewport, not just the bounds.
//
// Only the silhouette: lakes and river centrelines out here are never on
// screen in the seaboard frame, and carrying them cost ~770 points of
// geometry that Leaflet reprojects on every pan for nothing.
const LAND_BOUNDS = { west: -102.0, south: 20.0, east: -52.0, north: 55.0 };
const PRECISION = 2; // ~1.1km — chart is viewed at zoom 5–7, not street level

// The far shore of the crossing. Four events sit in London and Paris, and a
// European target centred on blank parchment reads as a bug. This frame is
// only ever seen at zoom 3–4, so it comes from the coarse 110m world set —
// ~7KB against the 29KB the seaboard costs at 50m.
//
// Deliberately NOT run through simplifyCollection: 110m is already generalised
// by Natural Earth, and a second Visvalingam pass on top of it shredded the
// Channel and the Breton and Iberian coasts into loose triangles.
// No European land reaches 34°N — Tarifa, the southern tip of Spain, is 36 —
// so the clipper leaves no straight cut anywhere a viewer could mistake for
// coastline. North Africa is deliberately excluded for the same reason: it
// runs off the bottom of the frame and would be sliced flat.
const EUROPE_BOUNDS = { west: -12.0, south: 34.0, east: 14.0, north: 60.0 };

const roundAt = (n, precision) => Math.round(n * 10 ** precision) / 10 ** precision;

// Visvalingam simplification keyed by quantile so we keep ~half the vertices —
// enough for zoom 5–7, cheap enough that SVG path updates don't hitch.
function simplifyCollection(featureCollection, keepQuantile = 0.4) {
  if (!featureCollection.features?.length) return featureCollection;
  const topo = topology({ collection: featureCollection });
  const pre = presimplify(topo);
  const weight = Math.max(quantile(pre, keepQuantile) || 0, 1e-8);
  const simplified = simplify(pre, weight);
  return topojson.feature(simplified, simplified.objects.collection);
}

const roundGeometry = (geom, precision = PRECISION) => {
  const roundRing = (ring) => ring.map(([x, y]) => [roundAt(x, precision), roundAt(y, precision)]);
  switch (geom.type) {
    case 'Polygon':
      return { ...geom, coordinates: geom.coordinates.map(roundRing) };
    case 'MultiPolygon':
      return { ...geom, coordinates: geom.coordinates.map((p) => p.map(roundRing)) };
    case 'LineString':
      return { ...geom, coordinates: roundRing(geom.coordinates) };
    case 'MultiLineString':
      return { ...geom, coordinates: geom.coordinates.map(roundRing) };
    default:
      return geom;
  }
};

// Sutherland–Hodgman rectangular clip for a single ring
function clipRing(ring, { west, south, east, north }) {
  const edges = [
    { inside: (p) => p[0] >= west, cross: (a, b) => [west, a[1] + ((west - a[0]) * (b[1] - a[1])) / (b[0] - a[0])] },
    { inside: (p) => p[0] <= east, cross: (a, b) => [east, a[1] + ((east - a[0]) * (b[1] - a[1])) / (b[0] - a[0])] },
    { inside: (p) => p[1] >= south, cross: (a, b) => [a[0] + ((south - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), south] },
    { inside: (p) => p[1] <= north, cross: (a, b) => [a[0] + ((north - a[1]) * (b[0] - a[0])) / (b[1] - a[1]), north] },
  ];
  let output = ring;
  for (const edge of edges) {
    const input = output;
    output = [];
    for (let i = 0; i < input.length; i++) {
      const curr = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (edge.inside(curr)) {
        if (!edge.inside(prev)) output.push(edge.cross(prev, curr));
        output.push(curr);
      } else if (edge.inside(prev)) {
        output.push(edge.cross(prev, curr));
      }
    }
    if (output.length === 0) return null;
  }
  return output;
}

function clipPolygonGeometry(geom, bounds) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const clipped = [];
  for (const poly of polys) {
    const rings = poly.map((ring) => clipRing(ring, bounds)).filter(Boolean);
    if (rings.length && rings[0].length >= 3) clipped.push(rings);
  }
  if (!clipped.length) return null;
  return clipped.length === 1
    ? { type: 'Polygon', coordinates: clipped[0] }
    : { type: 'MultiPolygon', coordinates: clipped };
}

// Keep runs of in-bounds points from a line (bbox edge is off-view, so no interpolation needed)
function clipLineGeometry(geom, bounds) {
  const lines = geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
  const inside = (p) => p[0] >= bounds.west && p[0] <= bounds.east && p[1] >= bounds.south && p[1] <= bounds.north;
  const runs = [];
  for (const line of lines) {
    let run = [];
    for (const p of line) {
      if (inside(p)) {
        run.push(p);
      } else if (run.length > 1) {
        runs.push(run);
        run = [];
      } else {
        run = [];
      }
    }
    if (run.length > 1) runs.push(run);
  }
  if (!runs.length) return null;
  return runs.length === 1
    ? { type: 'LineString', coordinates: runs[0] }
    : { type: 'MultiLineString', coordinates: runs };
}

async function fetchJson(url) {
  console.log(`fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const statesTopo = await fetchJson('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json');
const countriesTopo = await fetchJson('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json');
const lakesGeo = await fetchJson('https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_lakes.json');
const riversGeo = await fetchJson('https://cdn.jsdelivr.net/gh/martynafford/natural-earth-geojson@master/50m/physical/ne_50m_rivers_lake_centerlines.json');
const worldCoarseTopo = await fetchJson('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

const statesObj = statesTopo.objects.states;
const stateGeoms = new Map(statesObj.geometries.map((g) => [g.properties.name, g]));

const mergeStates = (names) => {
  const geoms = names.map((n) => {
    const g = stateGeoms.get(n);
    if (!g) throw new Error(`state not found: ${n}`);
    return g;
  });
  return topojson.merge(statesTopo, geoms);
};

// Colonial-era shapes from modern states:
//   Virginia claimed present WV and KY; North Carolina claimed TN;
//   the New Hampshire Grants (VT) were administered from NH;
//   the District of Maine belonged to Massachusetts.
const colonyDefs = [
  ['Massachusetts', ['Massachusetts']],
  ['District of Maine', ['Maine']],
  ['New Hampshire', ['New Hampshire', 'Vermont']],
  ['Rhode Island', ['Rhode Island']],
  ['Connecticut', ['Connecticut']],
  ['New York', ['New York']],
  ['New Jersey', ['New Jersey']],
  ['Pennsylvania', ['Pennsylvania']],
  ['Delaware', ['Delaware']],
  ['Maryland', ['Maryland']],
  ['Virginia', ['Virginia', 'West Virginia', 'Kentucky']],
  ['North Carolina', ['North Carolina', 'Tennessee']],
  ['South Carolina', ['South Carolina']],
  ['Georgia', ['Georgia']],
];

const colonyShapes = {};
for (const [name, states] of colonyDefs) {
  const merged = mergeStates(states);
  const clipped = clipPolygonGeometry(merged, BOUNDS);
  colonyShapes[name] = roundGeometry(clipped ?? merged);
}

// Land silhouette: every state in or near the chart bounds, merged into one
// shape so colony fills sit on it without coastline slivers.
const landStates = [
  'Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut',
  'New York', 'New Jersey', 'Pennsylvania', 'Delaware', 'Maryland', 'Virginia',
  'West Virginia', 'North Carolina', 'South Carolina', 'Georgia', 'Florida',
  'Ohio', 'Kentucky', 'Tennessee', 'Alabama', 'Mississippi', 'Indiana', 'Michigan', 'Illinois',
  'Wisconsin', 'Missouri', 'Arkansas', 'Louisiana', 'Iowa', 'Minnesota',
  // Never on screen. Present only so the silhouette runs past the west edge of
  // the viewport — without them the merged shape stops on the Minnesota and
  // Missouri state lines, which reads as a straight cut in the coast.
  'North Dakota', 'South Dakota', 'Nebraska', 'Kansas', 'Oklahoma', 'Texas',
];
const usLand = clipPolygonGeometry(mergeStates(landStates), LAND_BOUNDS);

const countryGeoms = topojson.feature(countriesTopo, countriesTopo.objects.countries).features;
const neighborLand = [];
for (const name of ['Canada', 'Bahamas', 'Bermuda', 'Cuba']) {
  const feat = countryGeoms.find((f) => f.properties.name === name);
  if (!feat) { console.warn(`country not in 50m set: ${name}`); continue; }
  const clipped = clipPolygonGeometry(feat.geometry, LAND_BOUNDS);
  if (clipped) neighborLand.push({ name, geometry: roundGeometry(clipped) });
}

const landFeatures = [
  { type: 'Feature', properties: { name: 'United Colonies' }, geometry: roundGeometry(usLand) },
  ...neighborLand.map((n) => ({ type: 'Feature', properties: { name: n.name }, geometry: n.geometry })),
];

// The far shore: the courts the war was decided in, plus enough neighbouring
// coast that the outline reads as Europe rather than a stray blob.
//
// Merged into one silhouette before clipping, the same way the seaboard is.
// Drawn as separate country features they render as a scatter of tiles with
// parchment showing through every land border — the chart has no political
// boundaries over here, only coastline.
const coarseCountries = worldCoarseTopo.objects.countries.geometries;
const europeCountries = [
  'France', 'United Kingdom', 'Ireland', 'Spain', 'Portugal',
  'Netherlands', 'Belgium', 'Germany', 'Denmark', 'Switzerland',
  'Italy', 'Luxembourg',
];
const europeGeoms = europeCountries
  .map((name) => {
    const g = coarseCountries.find((c) => c.properties.name === name);
    if (!g) console.warn(`country not in 110m set: ${name}`);
    return g;
  })
  .filter(Boolean);
const europeMerged = clipPolygonGeometry(
  topojson.merge(worldCoarseTopo, europeGeoms),
  EUROPE_BOUNDS
);
const europeFC = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { name: 'Europe' }, geometry: roundGeometry(europeMerged) }],
};

const lakeFeatures = [];
for (const f of lakesGeo.features) {
  if (!f.geometry) continue;
  const clipped = clipPolygonGeometry(f.geometry, BOUNDS);
  if (clipped) {
    lakeFeatures.push({
      type: 'Feature',
      properties: { name: f.properties.name || '' },
      geometry: roundGeometry(clipped),
    });
  }
}

const riverFeatures = [];
for (const f of riversGeo.features) {
  if (!f.geometry) continue;
  const clipped = clipLineGeometry(f.geometry, BOUNDS);
  if (clipped) {
    riverFeatures.push({
      type: 'Feature',
      properties: { name: f.properties.name || '' },
      geometry: roundGeometry(clipped),
    });
  }
}

const landFC = simplifyCollection({ type: 'FeatureCollection', features: landFeatures }, 0.35);
const lakesFC = simplifyCollection({ type: 'FeatureCollection', features: lakeFeatures }, 0.3);
const riversFC = simplifyCollection({ type: 'FeatureCollection', features: riverFeatures }, 0.3);

const simplifiedColonies = {};
for (const [name, geom] of Object.entries(colonyShapes)) {
  const fc = simplifyCollection(
    { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name }, geometry: geom }] },
    0.35
  );
  simplifiedColonies[name] = fc.features[0]?.geometry ?? geom;
}

const countCoords = (g, n = 0) => {
  if (!g) return n;
  if (Array.isArray(g) && typeof g[0] === 'number') return n + 1;
  if (Array.isArray(g)) return g.reduce((a, x) => countCoords(x, a), n);
  if (g.coordinates) return countCoords(g.coordinates, n);
  if (g.geometry) return countCoords(g.geometry, n);
  if (g.features) return g.features.reduce((a, f) => countCoords(f, a), n);
  if (typeof g === 'object') return Object.values(g).reduce((a, v) => countCoords(v, a), n);
  return n;
};

mkdirSync(OUT_DIR, { recursive: true });

const header = '// Generated by scripts/build-geo-data.mjs — do not edit by hand.\n';

writeFileSync(
  join(OUT_DIR, 'colonyShapes.js'),
  `${header}export const colonyShapes = ${JSON.stringify(simplifiedColonies)};\n`
);

writeFileSync(
  join(OUT_DIR, 'baseMap.js'),
  `${header}export const landAreas = ${JSON.stringify(landFC)};\n\n` +
  `export const lakes = ${JSON.stringify(lakesFC)};\n\n` +
  `export const rivers = ${JSON.stringify(riversFC)};\n\n` +
  `export const europeLand = ${JSON.stringify(europeFC)};\n`
);

console.log(`colonies: ${Object.keys(simplifiedColonies).length} (${countCoords(simplifiedColonies)} pts)`);
console.log(`land features: ${landFC.features.length} (${countCoords(landFC)} pts) — ${neighborLand.map((n) => n.name).join(', ')}`);
console.log(`lakes: ${lakesFC.features.length} (${countCoords(lakesFC)} pts)`);
console.log(`rivers: ${riversFC.features.length} (${countCoords(riversFC)} pts)`);
console.log(`europe: ${europeFC.features.length} (${countCoords(europeFC)} pts)`);
