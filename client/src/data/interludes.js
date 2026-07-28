/**
 * Data interludes spliced into the story flow after key events.
 * Each one shows a snapshot of the war's data "as known so far":
 * chart data is cut off at yearCutoff so the numbers match the
 * point in the story where the interlude appears.
 */
export const interludes = [
  {
    id: 'interlude-casualties-1775',
    afterEventId: 5, // Battle of Bunker Hill
    title: 'The Cost of Rebellion',
    takeaway:
      'The first year of fighting proved both sides would bleed. At Bunker Hill the British took over 1,000 casualties — nearly half their attacking force — to win a single hill.',
    chart: 'casualties',
    yearCutoff: 1775,
  },
  {
    id: 'interlude-trade-1776',
    afterEventId: 8, // Declaration of Independence
    title: 'Trade Severed',
    takeaway:
      'Independence was economic as much as political. Official-value imports from England fell about 98.7% between 1771 and 1776 as boycotts and war severed imperial trade.',
    chart: 'trade',
    yearCutoff: 1776,
  },
  {
    id: 'interlude-armies-1778',
    afterEventId: 13, // Valley Forge Winter Encampment
    title: 'Armies in the Field',
    takeaway:
      'The army that marched out of Valley Forge was better trained, but annual service totals are not simultaneous field strength: short enlistments, militia tours, and reenlistments can count one person more than once.',
    chart: 'army',
    yearCutoff: 1778,
  },
  {
    id: 'interlude-ledger-1781',
    afterEventId: 16, // Siege of Yorktown
    title: 'The Full Ledger',
    takeaway:
      'Six years of battle, tallied. The war swept from New England through the Mid-Atlantic to the decisive Southern theater, ending with Cornwallis trapped at Yorktown.',
    chart: 'fullLedger',
    yearCutoff: 1783,
  },
];
