// The mobile bottom sheet covers this fraction of the viewport at its peek
// snap. Two places have to agree on it: the sheet, which snaps there, and the
// map, which lifts the active marker clear of it. They lived as independent
// literals in two files until this constant existed — tuning one silently
// broke the other's centring.
export const MOBILE_SHEET_PEEK_RATIO = 0.55;
