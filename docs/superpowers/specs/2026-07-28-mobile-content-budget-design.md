# Mobile: put place and narrative on screen together

Date: 2026-07-28
Addresses: ROADMAP.md open work item 1
Scope: route 1 ("reclaim the content budget") only

## The problem, measured

On mobile the default (peek) state shows a map crop, a toolbar, a painting and
a headline. The argument the visualisation exists to make — this happened
*here* — is split across two states the reader has to toggle between.

Measured on the running app at 390×844, event 1:

| | value |
|---|---|
| sheet height at peek | 464px |
| chrome | 214px (46%) — 60px handle + 154px controls |
| control rows | 3 (they wrap; y=442, 491, 541) |
| hero image | 153px |
| title | y=803 of 844 |
| first prose line | y=893 — 49px below the fold |

The mobile map also uses the desktop seaboard zoom of 6, which in a 390×332
strip is about two and a half colonies.

## Worst case

The binding constraint is not the median entry. It is an entry with **both** a
hero image and a long description.

Only 18 of 47 events can have a hero: `useEventImage` resolves nothing unless
the event carries an `image` field, and the Wikipedia fallback only fires when
that field exists and 404s. Description lengths across all 47: min 219, median
264, p90 333, max 435. The longest overall (event 127, "Franklin Arrives in
France", 435 chars) has **no** image, so it is not the worst case.

The worst case is **event 9, "Battle of Long Island"** — hero plus 333 chars.
All designs below are validated against it.

## Design

Three edits. Each was verified in the running app before being specified.

### 1. Controls leave the peek row

`.bottom-sheet-controls` — the always-visible Play / speed / Filter / Search /
Focus-cards row — is replaced by a single labelled control button in the handle
row. Sheet chrome drops from 214px to ~60px.

Behind that button, one **flat** panel carries Play, speed, Search and the
filter chips, rendered through the sheet's existing `panelContent` slot. The
current "Filter button opens the filters panel" indirection collapses: the
panel is already a disclosure, so nesting a second one inside it is redundant.

### 2. Hero image is dropped in the peek state

Hidden at peek on every mobile size; returns as soon as the sheet expands.

Rejected alternative: letterboxing the hero to `12vh`. It passes on 390×844 but
still overflows by 34px on 375×667, and salvaging it needs a
`@media (min-height: …)` breakpoint on a magic number, which makes the peek
state differ by device and doubles what the tests must cover.

What the roadmap identifies as missing is the argument, not the picture. With
the hero gone at peek the freed space pulls the outcome chips and stats table
up instead.

### 3. Mobile seaboard zoom 6 → 5

`Map.jsx` gains `SEABOARD_MOBILE_ZOOM = 5` alongside the existing
`SEABOARD_ZOOM = 6`, selected by the component's existing `isMobile` state — the
same mechanism `OVERSEAS_MOBILE_ZOOM` already uses. The seaboard `minZoom` is
already 5, so no floor change is needed. The strip goes from ~2.5 colonies to Quebec →
Pennsylvania — a legible theatre.

### Result

Opening paragraph's distance from the fold, event 9, controls removed
(negative = clear of the fold, i.e. passing):

| treatment | 390×844 | 375×667 |
|---|---|---|
| hero natural (147–153px) | +10 ✗ | +101 ✗ |
| hero letterboxed to 12vh | −42 ✓ | +34 ✗ |
| **hero dropped at peek** | **−153 ✓** | **−55 ✓** |

Map strip holds 45% of viewport height in all passing cases.

Note that removing the controls *alone* fails the worst case on both sizes —
narrowly on 390×844, badly on 375×667. Both edits are required.

## Components

| File | Change |
|---|---|
| `MobileBottomSheet.jsx` | Replace the controls row with one control button in the handle row. Delete the `locked` prop and its four branches (drag disable, forced snap, handle disabled, aria swap). Set a peek-state class on the content container. |
| `ExploreView.jsx` | New flat sheet-controls panel. Stop rendering the view-mode toggle on mobile. Force `viewMode` back to `'map'` when the media query flips to mobile. |
| `EventCard.jsx` / `App.css` | Hide `.event-card-image` under the peek-state class. |
| `Map.jsx` | Mobile seaboard zoom of 5. |

### Focus cards

Dropped on mobile, kept on desktop. It locked the sheet to full and hid the
map — the exact state this work exists to get away from — and expanding the
sheet already gives mobile a full-bleed read. Removing it deletes the `locked`
branches from `MobileBottomSheet`.

A desktop→mobile resize must not strand `viewMode` at `'cards'`, which would
leave the map hidden with no control to bring it back; hence the reset.

## Coupling to fix while we are here

`Map.jsx:859` hardcodes `coveredRatio = 0.55` to mirror `SNAP_PEEK_RATIO = 0.55`
in `MobileBottomSheet.jsx`. Two independent literals that must agree or the map
centres the active marker wrong. Both stay at 0.55, but they should read from
one exported constant, so that tuning the peek ratio cannot silently break the
map's centring.

The constant lives in a small shared module rather than in either component —
`Map.jsx` importing from `MobileBottomSheet.jsx` would make the map depend on a
sheet it never renders.

This is in code the change already touches. No other refactoring is in scope.

## Testing

New Playwright test, run at **390×844 and 375×667**, on **event 9** — the worst
case, not event 1:

- in the default peek state, the opening paragraph's bounding box is fully
  above the fold
- the map strip is ≥40% of viewport height

Existing tests to update — both assert against current sheet chrome:

- `mobile explore view uses a bounded, expandable bottom sheet`
- `mobile explore view is accessible and the sheet handle is keyboard reachable`
  — the new control button must be in the a11y scan and the tab order

Interlude coverage: assert the **standfirst paragraph** above the fold, not the
chart. Measured, the interlude chart fits on 390×844 (bottom at 840 of 844) but
overflows by 94px on 375×667, so a chart assertion would be wrong rather than
merely flaky.

Verification is against the running app with Playwright as well as through the
suite — every number in this spec came from the former.

## Out of scope

- **Route 2**, replacing the sheet with a sticky map. Stays in ROADMAP as an
  unscheduled option, re-assessed after this ships. The co-presence defect this
  spec fixes was its main justification; what remains is a preference for
  scroll-driven reading, not a bug.
- ROADMAP items 2–7.

## Follow-up

Update ROADMAP item 1 with the measured outcome once this lands, so the next
reader sees the result rather than the original complaint.
