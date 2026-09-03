import { events } from './events.js';

const source = (label, url) => ({ label, url });

/**
 * Aggregate sources use different historical definitions and scopes.
 * Each chart explains what its series measures rather than treating unlike
 * figures as one universal total.
 */
export const aggregateSources = {
  americanWarToll: source(
    "U.S. Department of Veterans Affairs — America's Wars",
    "https://department.va.gov/americas-wars/"
  ),
  americanManpower: source(
    "U.S. Army Center of Military History — History of Military Mobilization",
    "https://history.army.mil/portals/143/Images/Publications/catalog/104-10.pdf"
  ),
  englandTrade: source(
    "U.S. Census Bureau — Historical Statistics, Colonial Times to 1957",
    "https://www2.census.gov/library/publications/1960/compendia/hist_stats_colonial-1957/hist_stats_colonial-1957-chZ.pdf"
  )
};

export const warSummaryData = {
  servicemembers: 217000,
  serviceEstimateRange: [184000, 250000],
  battleDeaths: 4435,
  nonMortalWoundings: 6188,
  source: aggregateSources.americanWarToll,
  note: "The VA/Department of Defense series covers U.S. servicemembers, not every Patriot, allied, Crown, Indigenous, or civilian loss. Its death figures are based on incomplete returns."
};

/**
 * U.S. troops furnished during each year, not average simultaneous strength.
 * Militia combines militia found in army returns with the Army study's
 * estimate of additional short-term militia service. Short enlistments and
 * reenlistments mean a person may appear more than once in these annual totals.
 */
export const armyData = [
  { year: 1775, continentalPay: 27443, militia: 10180, totalFurnished: 37623 },
  { year: 1776, continentalPay: 46891, militia: 42760, totalFurnished: 89651 },
  { year: 1777, continentalPay: 34820, militia: 33900, totalFurnished: 68720 },
  { year: 1778, continentalPay: 32899, militia: 18153, totalFurnished: 51052 },
  { year: 1779, continentalPay: 27699, militia: 17485, totalFurnished: 45184 },
  { year: 1780, continentalPay: 21015, militia: 21811, totalFurnished: 42826 },
  { year: 1781, continentalPay: 13292, militia: 16048, totalFurnished: 29340 }
];

/**
 * Census series Z 21-34: official-value trade between the American colonies
 * and England, in millions of pounds sterling. These are useful as a relative
 * trade index; the Census notes that official customs values were not current
 * market values.
 */
export const economicData = [
  { year: 1770, colonialExports: 1.015535, colonialImports: 1.925571 },
  { year: 1771, colonialExports: 1.339840, colonialImports: 4.202472 },
  { year: 1772, colonialExports: 1.258515, colonialImports: 3.012635 },
  { year: 1773, colonialExports: 1.369229, colonialImports: 1.979412 },
  { year: 1774, colonialExports: 1.373846, colonialImports: 2.590437 },
  { year: 1775, colonialExports: 1.920950, colonialImports: 0.196162 },
  { year: 1776, colonialExports: 0.103964, colonialImports: 0.055415 }
];

/**
 * Chart-ready selections derived from the canonical catalog.
 * These casualty entries must not be added to infer total war deaths because
 * their event definitions can include wounded, missing, and captured troops.
 */
export const battleData = events
  .filter(event => event.casualties && event.forces)
  .map(event => ({
    id: event.id,
    title: event.title
      .replace('Battles of ', '')
      .replace('Battle of ', '')
      .replace('British Surrender at ', '')
      .replace('Siege of ', '')
      .replace('Capture of ', '')
      .replace('Fall of Fort Ticonderoga', 'Fall of Ticonderoga'),
    year: event.year,
    americanCasualties: event.casualties.american,
    britishCasualties: event.casualties.british,
    americanForces: event.forces.american,
    britishForces: event.forces.british,
    outcome: event.outcome,
    campaign: event.campaign,
    combatants: event.combatants,
    statNote: event.statNote,
    source: event.source
  }));

/**
 * Interpretive ranges for the operations shown in the chronology. They are
 * not claims of continuous fighting or universally fixed campaign boundaries.
 */
export const campaignData = [
  { name: "Canadian Campaign", start: "1775-05-10", end: "1776-06-18", region: "north" },
  { name: "New England Campaign", start: "1775-04-19", end: "1776-03-17", region: "north" },
  { name: "New York & New Jersey", start: "1776-08-27", end: "1777-01-03", region: "mid" },
  { name: "Saratoga Campaign", start: "1777-06-01", end: "1777-10-17", region: "north" },
  { name: "Philadelphia Campaign", start: "1777-09-11", end: "1778-06-28", region: "mid" },
  { name: "Rhode Island Operations", start: "1778-07-29", end: "1778-08-31", region: "north" },
  { name: "Southern Campaign", start: "1778-12-29", end: "1781-09-08", region: "south" },
  { name: "Spanish Gulf Campaign", start: "1779-08-27", end: "1781-05-10", region: "south" },
  { name: "Yorktown", start: "1781-08-19", end: "1781-10-19", region: "south" }
];
