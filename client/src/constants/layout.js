// The mobile bottom sheet covers this fraction of the viewport at its peek
// snap. Two places have to agree on it: the sheet, which snaps there, and the
// map, which lifts the active marker clear of it. They lived as independent
// literals in two files until this constant existed — tuning one silently
// broke the other's centring.
export const MOBILE_SHEET_PEEK_RATIO = 0.55;

// ...but never more than this many pixels of it.
//
// A fraction is the right rule for a phone, where 55% of 844px is a card you
// can read and a map you can still see. On a 768x1024 tablet — the tallest
// viewport the mobile layout covers — the same fraction is 563px of sheet,
// more card than the card has to say, and it takes the map's share with it.
//
// It also put the southernmost event out of reach. Lifting a marker clear of
// the sheet moves the map centre south by half the covered height, and at
// 563px that pushed the view's south edge below 20°N, where the land
// silhouette is clipped and the frame will not follow: Pensacola came to rest
// 36px behind the sheet describing it. Capped, the lift is small enough for
// the frame to grant it.
//
// 480px rather than a second fraction: what the card needs is an absolute
// height, not a share of whatever screen it lands on. It clears the marker's
// whole 44px touch target rather than just its centre — measured at 16px of
// overlap on a tablet at 520, and 8px on a 430x932 phone, where only the
// centre had ever been checked.
export const MOBILE_SHEET_PEEK_MAX = 480;

/** The peek height for a viewport, in pixels. */
export const mobileSheetPeek = (viewportHeight) => (
  Math.min(viewportHeight * MOBILE_SHEET_PEEK_RATIO, MOBILE_SHEET_PEEK_MAX)
);
