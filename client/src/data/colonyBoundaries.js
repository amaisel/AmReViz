import { colonyShapes } from './geo/colonyShapes';

// Colony identity and label anchors only, joined with coastline geometry
// generated from us-atlas 10m data (see scripts/build-geo-data.mjs).
//
// This used to carry population, export value, main export, founding year, and
// capital per colony. None of it was load-bearing: the colonies are a backdrop
// for the chronology, not a subject of it, and a hover tooltip of 1770 trade
// statistics pulled attention away from the story the map is there to tell.
// The figures are gone rather than corrected, so nothing here can drift out of
// step with a source again.
//
// Colonial-era claims are reflected in the shapes: Virginia includes Kentucky
// and West Virginia, North Carolina includes Tennessee, New Hampshire
// administers the Vermont grants, and the District of Maine belongs to
// Massachusetts.
const colonyInfo = [
  { name: "Massachusetts", abbrev: "MA", labelLat: 42.35, labelLng: -72.0 },
  { name: "District of Maine", abbrev: "ME (MA)", labelLat: 45.2, labelLng: -69.4 },
  { name: "New Hampshire", abbrev: "NH", labelLat: 43.9, labelLng: -71.9 },
  { name: "Rhode Island", abbrev: "RI", labelLat: 41.62, labelLng: -71.55 },
  { name: "Connecticut", abbrev: "CT", labelLat: 41.68, labelLng: -72.75 },
  { name: "New York", abbrev: "NY", labelLat: 42.9, labelLng: -75.4 },
  { name: "New Jersey", abbrev: "NJ", labelLat: 40.1, labelLng: -74.55 },
  { name: "Pennsylvania", abbrev: "PA", labelLat: 41.0, labelLng: -77.8 },
  { name: "Delaware", abbrev: "DE", labelLat: 39.1, labelLng: -75.5 },
  { name: "Maryland", abbrev: "MD", labelLat: 39.45, labelLng: -77.1 },
  { name: "Virginia", abbrev: "VA", labelLat: 37.6, labelLng: -78.7 },
  { name: "North Carolina", abbrev: "NC", labelLat: 35.55, labelLng: -79.4 },
  { name: "South Carolina", abbrev: "SC", labelLat: 34.0, labelLng: -81.0 },
  { name: "Georgia", abbrev: "GA", labelLat: 32.7, labelLng: -83.2 },
];

export const colonyBoundaries = {
  type: "FeatureCollection",
  features: colonyInfo.map((props) => ({
    type: "Feature",
    properties: props,
    geometry: colonyShapes[props.name]
  }))
};
