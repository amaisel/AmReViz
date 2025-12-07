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
    date: "1777-12-19",
    year: 1777,
    title: "Valley Forge Winter Encampment",
    location: "Valley Forge, Pennsylvania",
    lat: 40.1033,
    lng: -75.4444,
    type: "political",
    side: "american",
    description: "The Continental Army endured a brutal winter at Valley Forge. Despite losing nearly 2,000 men to cold, disease, and starvation, the army emerged stronger. Baron von Steuben drilled the troops into a professional fighting force, transforming them from militia to soldiers.",
    significance: "Crucible that forged the Continental Army into an effective fighting force; symbol of American perseverance."
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
