import { colonyShapes } from './geo/colonyShapes';

// Colony metadata (population, exports, label anchors) joined with accurate
// coastline geometry generated from us-atlas 10m data (see
// scripts/build-geo-data.mjs). Colonial-era claims are reflected in the
// shapes: Virginia includes Kentucky and West Virginia, North Carolina
// includes Tennessee, New Hampshire administers the Vermont grants, and the
// District of Maine belongs to Massachusetts.
const colonyInfo = [
  {
    name: "Massachusetts",
    abbrev: "MA",
    population: 338000,
    exports: 400000,
    mainExport: "Fish & Shipbuilding",
    founded: 1620,
    capital: "Boston",
    labelLat: 42.35,
    labelLng: -72.0
  },
  {
    name: "District of Maine",
    abbrev: "ME (MA)",
    population: 30000,
    exports: 50000,
    mainExport: "Lumber & Fish",
    founded: 1622,
    capital: "Falmouth",
    partOf: "Massachusetts",
    labelLat: 45.2,
    labelLng: -69.4
  },
  {
    name: "New Hampshire",
    abbrev: "NH",
    population: 62000,
    exports: 70000,
    mainExport: "Lumber & Masts",
    founded: 1623,
    capital: "Portsmouth",
    labelLat: 43.9,
    labelLng: -71.9
  },
  {
    name: "Rhode Island",
    abbrev: "RI",
    population: 58000,
    exports: 90000,
    mainExport: "Rum & Trade",
    founded: 1636,
    capital: "Providence",
    labelLat: 41.62,
    labelLng: -71.55
  },
  {
    name: "Connecticut",
    abbrev: "CT",
    population: 198000,
    exports: 100000,
    mainExport: "Livestock & Grains",
    founded: 1636,
    capital: "Hartford",
    labelLat: 41.68,
    labelLng: -72.75
  },
  {
    name: "New York",
    abbrev: "NY",
    population: 163000,
    exports: 200000,
    mainExport: "Wheat & Flour",
    founded: 1626,
    capital: "New York City",
    labelLat: 42.9,
    labelLng: -75.4
  },
  {
    name: "New Jersey",
    abbrev: "NJ",
    population: 130000,
    exports: 80000,
    mainExport: "Iron & Grain",
    founded: 1664,
    capital: "Perth Amboy",
    labelLat: 40.1,
    labelLng: -74.55
  },
  {
    name: "Pennsylvania",
    abbrev: "PA",
    population: 270000,
    exports: 350000,
    mainExport: "Flour & Iron",
    founded: 1681,
    capital: "Philadelphia",
    labelLat: 41.0,
    labelLng: -77.8
  },
  {
    name: "Delaware",
    abbrev: "DE",
    population: 35000,
    exports: 40000,
    mainExport: "Grain & Flour",
    founded: 1638,
    capital: "Dover",
    labelLat: 39.1,
    labelLng: -75.5
  },
  {
    name: "Maryland",
    abbrev: "MD",
    population: 203000,
    exports: 400000,
    mainExport: "Tobacco",
    founded: 1634,
    capital: "Annapolis",
    labelLat: 39.45,
    labelLng: -77.1
  },
  {
    name: "Virginia",
    abbrev: "VA",
    population: 447000,
    exports: 1000000,
    mainExport: "Tobacco",
    founded: 1607,
    capital: "Williamsburg",
    labelLat: 37.6,
    labelLng: -78.7
  },
  {
    name: "North Carolina",
    abbrev: "NC",
    population: 197000,
    exports: 150000,
    mainExport: "Naval Stores & Tobacco",
    founded: 1653,
    capital: "New Bern",
    labelLat: 35.55,
    labelLng: -79.4
  },
  {
    name: "South Carolina",
    abbrev: "SC",
    population: 124000,
    exports: 600000,
    mainExport: "Rice & Indigo",
    founded: 1663,
    capital: "Charles Town",
    labelLat: 34.0,
    labelLng: -81.0
  },
  {
    name: "Georgia",
    abbrev: "GA",
    population: 23000,
    exports: 100000,
    mainExport: "Indigo & Rice",
    founded: 1733,
    capital: "Savannah",
    labelLat: 32.7,
    labelLng: -83.2
  }
];

export const colonyBoundaries = {
  type: "FeatureCollection",
  features: colonyInfo.map((props) => ({
    type: "Feature",
    properties: props,
    geometry: colonyShapes[props.name]
  }))
};
