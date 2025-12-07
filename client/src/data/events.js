export const events = [
  {
    id: 1,
    date: "1773-12-16",
    year: 1773,
    title: "Boston Tea Party",
    location: "Boston Harbor, Massachusetts",
    lat: 42.3520,
    lng: -71.0480,
    type: "political",
    side: "american",
    description: "Colonists, disguised as Mohawk Indians, boarded three British ships and dumped 342 chests of tea into Boston Harbor to protest the Tea Act. This act of defiance galvanized colonial resistance and led Britain to pass the punitive Intolerable Acts.",
    significance: "Catalyst for revolution; demonstrated colonial willingness to take direct action against British policies."
  },
  {
    id: 2,
    date: "1775-04-19",
    year: 1775,
    title: "Battles of Lexington and Concord",
    location: "Lexington & Concord, Massachusetts",
    lat: 42.4495,
    lng: -71.2310,
    type: "battle",
    side: "american",
    description: "The 'shot heard round the world.' British troops marched to seize colonial weapons at Concord. Colonial militiamen confronted them at Lexington Green, and fighting erupted. By day's end, colonists had inflicted 273 British casualties while suffering 95 of their own.",
    significance: "First military engagements of the Revolutionary War; proved colonists would fight."
  },
  {
    id: 3,
    date: "1775-06-17",
    year: 1775,
    title: "Battle of Bunker Hill",
    location: "Charlestown, Massachusetts",
    lat: 42.3763,
    lng: -71.0608,
    type: "battle",
    side: "british",
    description: "Colonial forces fortified Breed's Hill overlooking Boston. British forces launched three frontal assaults, finally taking the position but suffering over 1,000 casualties—nearly half their attacking force. The famous order 'Don't fire until you see the whites of their eyes' came from this battle.",
    significance: "Though a British victory, it proved American forces could stand against professional soldiers."
  },
  {
    id: 4,
    date: "1776-07-04",
    year: 1776,
    title: "Declaration of Independence",
    location: "Philadelphia, Pennsylvania",
    lat: 39.9489,
    lng: -75.1500,
    type: "political",
    side: "american",
    description: "The Continental Congress adopted Thomas Jefferson's Declaration of Independence, formally severing ties with Britain. The document articulated Enlightenment ideals of natural rights and consent of the governed, influencing democratic movements worldwide.",
    significance: "Birth of the United States as an independent nation; defined American ideals of liberty and equality."
  },
  {
    id: 5,
    date: "1776-12-26",
    year: 1776,
    title: "Battle of Trenton",
    location: "Trenton, New Jersey",
    lat: 40.2206,
    lng: -74.7597,
    type: "battle",
    side: "american",
    description: "After crossing the ice-choked Delaware River on Christmas night, Washington launched a surprise attack on Hessian mercenaries. The Americans captured nearly 900 prisoners with minimal casualties, reviving a cause that had seemed lost after months of defeat.",
    significance: "Restored American morale after devastating losses; proved Washington's tactical genius."
  },
  {
    id: 6,
    date: "1777-10-17",
    year: 1777,
    title: "British Surrender at Saratoga",
    location: "Saratoga, New York",
    lat: 43.0025,
    lng: -73.6260,
    type: "battle",
    side: "american",
    description: "British General John Burgoyne surrendered his entire army of 6,000 men after being surrounded by American forces. This was the first major British defeat and the war's turning point, as it convinced France to formally ally with the United States.",
    significance: "Turning point of the war; secured crucial French alliance with military and financial support."
  },
  {
    id: 7,
    date: "1778-02-06",
    year: 1778,
    title: "Treaty of Alliance with France",
    location: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    type: "diplomatic",
    side: "american",
    description: "France formally recognized American independence and pledged military support. The alliance brought French troops, a powerful navy, and desperately needed financial aid. Spain and the Netherlands would also eventually join against Britain.",
    significance: "Transformed a colonial rebellion into a global conflict; French aid proved decisive."
  },
  {
    id: 8,
    date: "1781-10-19",
    year: 1781,
    title: "Siege of Yorktown",
    location: "Yorktown, Virginia",
    lat: 37.2388,
    lng: -76.5097,
    type: "battle",
    side: "american",
    description: "Washington and French General Rochambeau trapped British General Cornwallis at Yorktown while the French fleet blocked escape by sea. After a three-week siege, Cornwallis surrendered 8,000 troops. The British band reportedly played 'The World Turned Upside Down.'",
    significance: "Last major battle; effectively ended the war and British hopes of retaining the colonies."
  },
  {
    id: 9,
    date: "1783-09-03",
    year: 1783,
    title: "Treaty of Paris",
    location: "Paris, France",
    lat: 48.8566,
    lng: 2.3522,
    type: "diplomatic",
    side: "american",
    description: "Britain formally recognized American independence and ceded all territory east of the Mississippi River. The treaty established generous boundaries for the new nation, though it left many issues—like British forts in the Northwest—unresolved.",
    significance: "Official end of the Revolutionary War; established the United States as a sovereign nation."
  },
  {
    id: 10,
    date: "1783-12-23",
    year: 1783,
    title: "Washington Resigns Commission",
    location: "Annapolis, Maryland",
    lat: 38.9784,
    lng: -76.4922,
    type: "political",
    side: "american",
    description: "In a remarkable act of republican virtue, George Washington voluntarily surrendered his military commission to Congress. King George III reportedly said that if Washington did this, he would be 'the greatest man in the world.' Washington's act set the precedent of civilian control over the military.",
    significance: "Established crucial precedent of civilian authority over the military; Washington became a symbol of republican ideals."
  }
];

export const armyData = [
  { year: 1775, continental: 27000, british: 8500, militia: 10000, label: "Army Established" },
  { year: 1776, continental: 20000, british: 32000, militia: 45000, label: "Peak Militia" },
  { year: 1777, continental: 34000, british: 30000, militia: 25000, label: "Saratoga Campaign" },
  { year: 1778, continental: 35000, british: 34000, militia: 20000, label: "Valley Forge" },
  { year: 1779, continental: 27000, british: 30000, militia: 15000, label: "Southern Campaign" },
  { year: 1780, continental: 21000, british: 28000, militia: 18000, label: "Crisis Year" },
  { year: 1781, continental: 23000, british: 25000, militia: 12000, label: "Yorktown" },
  { year: 1782, continental: 13000, british: 15000, militia: 5000, label: "War Ends" },
  { year: 1783, continental: 5000, british: 8000, militia: 2000, label: "Demobilization" }
];

export const economicData = [
  { year: 1770, colonialExports: 3.0, colonialImports: 3.5, teaImports: 0.37, label: "Pre-Crisis" },
  { year: 1771, colonialExports: 3.2, colonialImports: 4.2, teaImports: 0.35, label: "Trade Peak" },
  { year: 1772, colonialExports: 3.4, colonialImports: 3.8, teaImports: 0.37, label: "Before Tea Party" },
  { year: 1773, colonialExports: 3.1, colonialImports: 2.1, teaImports: 0.05, label: "Tea Party" },
  { year: 1774, colonialExports: 2.8, colonialImports: 2.6, teaImports: 0.02, label: "Intolerable Acts" },
  { year: 1775, colonialExports: 1.9, colonialImports: 0.2, teaImports: 0.00, label: "War Begins" },
  { year: 1776, colonialExports: 1.2, colonialImports: 0.1, teaImports: 0.00, label: "Independence" },
  { year: 1777, colonialExports: 0.8, colonialImports: 0.5, teaImports: 0.00, label: "Wartime" },
  { year: 1778, colonialExports: 1.0, colonialImports: 1.2, teaImports: 0.00, label: "French Alliance" }
];

export const colonyData = [
  { name: "Virginia", population: 447000, exports: 1000000, mainExport: "Tobacco", lat: 37.5, lng: -79.0 },
  { name: "Massachusetts", population: 338000, exports: 400000, mainExport: "Fish", lat: 42.4, lng: -71.4 },
  { name: "Pennsylvania", population: 270000, exports: 350000, mainExport: "Flour", lat: 40.0, lng: -76.5 },
  { name: "Maryland", population: 203000, exports: 400000, mainExport: "Tobacco", lat: 39.0, lng: -76.7 },
  { name: "New York", population: 163000, exports: 200000, mainExport: "Wheat", lat: 43.0, lng: -75.5 },
  { name: "Connecticut", population: 198000, exports: 100000, mainExport: "Livestock", lat: 41.6, lng: -72.7 },
  { name: "South Carolina", population: 124000, exports: 600000, mainExport: "Rice", lat: 33.8, lng: -80.9 },
  { name: "New Jersey", population: 130000, exports: 80000, mainExport: "Iron", lat: 40.1, lng: -74.7 },
  { name: "North Carolina", population: 197000, exports: 150000, mainExport: "Naval Stores", lat: 35.5, lng: -79.0 },
  { name: "Rhode Island", population: 58000, exports: 90000, mainExport: "Rum", lat: 41.7, lng: -71.5 },
  { name: "New Hampshire", population: 62000, exports: 70000, mainExport: "Lumber", lat: 43.5, lng: -71.5 },
  { name: "Delaware", population: 35000, exports: 40000, mainExport: "Grain", lat: 39.0, lng: -75.5 },
  { name: "Georgia", population: 23000, exports: 100000, mainExport: "Indigo", lat: 32.9, lng: -83.4 }
];
