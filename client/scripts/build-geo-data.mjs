// Builds accurate period-map geometry for the parchment chart.
//
// Sources:
//   - us-atlas states-10m (TopoJSON, accurate US state coasts)
//   - world-atlas countries-50m (Canada and neighbors)
//   - Natural Earth 50m lakes and river centerlines
//
// Outputs (ES modules under src/data/geo/):
//   - colonyShapes.js   accurate colony geometries keyed by colony name
//   - baseMap.js        land silhouette, lakes, rivers clipped to the chart bounds
//
// Run: node scripts/build-geo-data.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as topojson from 'topojson-client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'src', 'data', 'geo');

// Chart bounds with generous margin beyond the Leaflet maxBounds
// [28,-85]..[48,-60] so the data edge stays off-screen even on wide
// monitors at minZoom.
const BOUNDS = { west: -95.0, south: 23.0, east: -52.0, north: 52.0 };
const PRECISION = 3; // ~110m at the equator; plenty below zoom 9

const round = (n) => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION;

const roundGeometry = (geom) => {
  const roundRing = (ring) => ring.map(([x, y]) => [round(x), round(y)]);
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
];
const usLand = clipPolygonGeometry(mergeStates(landStates), BOUNDS);

const countryGeoms = topojson.feature(countriesTopo, countriesTopo.objects.countries).features;
const neighborLand = [];
for (const name of ['Canada', 'Bahamas', 'Bermuda', 'Cuba']) {
  const feat = countryGeoms.find((f) => f.properties.name === name);
  if (!feat) { console.warn(`country not in 50m set: ${name}`); continue; }
  const clipped = clipPolygonGeometry(feat.geometry, BOUNDS);
  if (clipped) neighborLand.push({ name, geometry: roundGeometry(clipped) });
}

const landFeatures = [
  { type: 'Feature', properties: { name: 'United Colonies' }, geometry: roundGeometry(usLand) },
  ...neighborLand.map((n) => ({ type: 'Feature', properties: { name: n.name }, geometry: n.geometry })),
];

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

mkdirSync(OUT_DIR, { recursive: true });

const header = '// Generated by scripts/build-geo-data.mjs — do not edit by hand.\n';

writeFileSync(
  join(OUT_DIR, 'colonyShapes.js'),
  `${header}export const colonyShapes = ${JSON.stringify(colonyShapes)};\n`
);

writeFileSync(
  join(OUT_DIR, 'baseMap.js'),
  `${header}export const landAreas = ${JSON.stringify({ type: 'FeatureCollection', features: landFeatures })};\n\n` +
  `export const lakes = ${JSON.stringify({ type: 'FeatureCollection', features: lakeFeatures })};\n\n` +
  `export const rivers = ${JSON.stringify({ type: 'FeatureCollection', features: riverFeatures })};\n`
);

console.log(`colonies: ${Object.keys(colonyShapes).length}`);
console.log(`land features: ${landFeatures.length} (${neighborLand.map((n) => n.name).join(', ')})`);
console.log(`lakes: ${lakeFeatures.length} — ${lakeFeatures.map((f) => f.properties.name).filter(Boolean).slice(0, 12).join(', ')}`);
console.log(`rivers: ${riverFeatures.length} — ${riverFeatures.map((f) => f.properties.name).filter(Boolean).slice(0, 20).join(', ')}`);
