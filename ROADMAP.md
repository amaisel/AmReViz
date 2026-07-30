# State of play

Last updated: 2026-07-28

A living note on where AmReViz stands and what is worth doing next. Every claim
here was measured rather than estimated; where a number appears, the method is
given so it can be re-checked when it goes stale.

## How to work here

`main` is protected by the "Protect main" ruleset, so all changes land through a
PR — including single-line docs edits. Approvals are no longer required (the
count is 0), so a PR can be merged as soon as it is green. `CODEOWNERS` still
assigns every path to `@amaisel`, but code-owner review is not enforced.

```bash
cd client
npm run dev            # vite, port 5173
npm run lint           # eslint, must be clean
npm run build          # must be clean
npx playwright test    # 29 tests; boots its own server on 5174
```

There is no `npm test` script — Playwright runs through `npx`. The suite starts
its own dev server on port 5174 so a `npm run dev` on 5173 can keep running
alongside it. Set `AMREVIZ_TEST_URL` to point the suite at a server you are
already running instead.

Map geometry under `client/src/data/geo/` is generated, not hand-edited:

```bash
node scripts/build-geo-data.mjs   # refetches from CDN, rewrites baseMap.js + colonyShapes.js
```

## Open work

### 1. Mobile map and narrative — fixed, route 2 still open

Resolved 2026-07-28. Mobile was structurally modal: the peek sheet spent 46%
of its 464px on chrome (a 60px drag handle plus a 154px control row that
wrapped to three lines at 390px wide), then 153px on a hero image, leaving the
first prose line 49px below the fold.

Two edits reclaimed the budget. The control row became one disclosure button in
the handle row, taking chrome from 214px to 60px. The hero image now yields its
space in the peek state and returns on expand.

Measured on the binding case: event 9, which carries a hero image and has the
longest description among the 18 events that can. Distance of the opening
paragraph from the fold, negative meaning clear:

| | 390×844 | 375×667 |
|---|---|---|
| before | +10 | +101 |
| after | **−153** | **−55** |

The map holds 45% of the viewport in both. Worth knowing for anyone revisiting
this: removing the controls *alone* failed on both sizes — it is the +10 and
+101 row above. Both edits were needed, and the 390×844 case passed by only
10px, which is why the tests use event 9 rather than event 1.

Cards focus was dropped on mobile in the same change — it locked the sheet to
full and hid the map — which deleted the `locked` branches from
`MobileBottomSheet`. It remains on desktop, and narrowing the window now resets
the view mode rather than stranding the map hidden.

**The mobile map keeps the desktop seaboard zoom of 6.** Dropping it to 5 was
tried and reverted. It does widen the strip from about two and a half colonies
to Quebec–Pennsylvania, but `easternSeaboardBounds` spans 27–48°N, which is only
~610px tall in Mercator at zoom 5 against ~1220px at zoom 6. Any viewport taller
than that box cannot be panned at all, so the offset that lifts the active event
clear of the sheet is silently discarded. Measured distance of the active marker
below the centre of the visible strip:

| | zoom 6 | zoom 5 |
|---|---|---|
| 390×844 | 37px | 108px |
| 754×1254 | 65px | 225px |

Nearly every phone is taller than 610px, so this is not an edge case. Buying the
wider frame means widening the bounds northward, and that exposes the clipper's
straight cut as a false coastline — see the note on the land silhouette below.
A test now pins the marker to within 15% of the strip centre on both shapes.

**The dark line across the sheet was the drag handle's focus ring.** It showed
on expand because expanding means clicking the handle. `index.css` paired
`button:focus` with `button:focus-visible`, so a pointer click painted it;
`currentColor` on the handle is `#1a1a1a` — rgb(26,26,26), the measured pixel
colour — and `outline-offset: 4px` put the ring 4px outside a full-width button
ending at y=122.7, landing the line at y=127, where it was measured. The sheet
clips its children, so the ring's top and sides were cut and only that bottom
edge survived. The bare `:focus` is gone, so pointer users see nothing at all,
and the indicator moved off the button onto the chevron — a 40px ring
inside a 377px button, so there is no full-width rectangle left to clip.

**The sheet is also opaque rather than frosted.** `backdrop-filter: blur(20px)`
was removed while chasing the line above. At 0.96 alpha the frosted effect was
almost invisible, so this costs nothing, but note it was not the cause.

**Still open: replacing the sheet with a sticky map.** The standard mobile
scrollytelling shape — a map strip pinned at roughly 30vh, article scrolling
under it, the map re-aiming as each event comes into view. This was the second
of the two routes, and its main justification was the co-presence defect above,
which is now fixed; what remains is a preference for scroll-driven reading
rather than a bug. It would delete `MobileBottomSheet` and its snap/gesture
logic including the horizontal swipe. A redesign, not an afternoon.

What not to do: fall back to static map images on mobile. The map is the piece.

### 2. Four of the eight type-badge colours fail WCAG contrast — fixed

Resolved alongside the mobile UX polish pass. Diplomatic (and inconclusive)
kept the parchment gold and switched to dark ink; military green was darkened
so white text clears 4.5:1. A Playwright check visits one event of each type.

### 3. Holding an arrow key still drops steps

Roughly 45–115 ms of work per step, and key-repeat outruns it. Below about
150 ms between presses a meaningful fraction of presses never land.

Two things have now been ruled out as the cause:

- **Memoising `mapEvents` and removing an O(n²) `indexOf`** — measured before
  and after, differences were inside the noise band.
- **Deleting the 37 event-trail polylines** (July 2026) — A/B'd on identical
  harnesses. SVG paths at Yorktown fell 185 → 148, but per-step cost went
  76 ms → 80 ms median and drop rates moved in both directions. No effect.

What remains is the marker layer: ~33 `divIcon` markers whose HTML is rebuilt
and re-inserted on every step, plus Leaflet reprojecting the overlay paths. The
real fix is canvas rendering for the markers, or holding icon instances stable
across steps so only the active/previous pair is touched. This is a genuine
piece of work, not a tidy-up.

### 4. The `metrics` chunk is 381.92 kB (112.58 kB gzip)

Recharts, pulled in whole. It is the largest asset in the build by some margin
and it only serves the data view. Splitting the chart components behind the
existing lazy-route boundary, or moving to a lighter chart library, would take
it off the initial path for anyone who never opens that view.

### 5. Unmerged parallel direction on `cursor/fix-review-findings-39f3`

Seven commits from 2026-07-20 redesigning the visualisation as editorial
scrollytelling. It forked from `6ab6c3f` on 2026-07-08 and was never merged;
`main` took the bottom-sheet route instead and has moved several major commits
past it. It is the only surviving copy of that work.

Either rebase it deliberately or delete it — leaving it to rot at an ever-growing
distance from `main` is the one outcome with no upside.

### 6. Reversing direction inside ~300ms drops the second step

Press right then left in quick succession and the story ends up one step
forward instead of back. Measured on the current code: four rapid
right-then-left pairs all landed on +1, while the same pair with a 400ms gap
is correct every time. Vertical keys, which no longer navigate, are stable at
1→1 across every run.

It is not specific to the keyboard — the mobile swipe handler goes through the
same path — and it predates the left/right switch, since up and left were
already both "previous". The suspect is the round trip between `setCurrentIndex`
and the hash sync in `useHashRouter`: the second press is applied and then
clobbered by the URL-driven update from the first.

Two tests currently work around it with an explicit settle, and say so.

### 7. Nits

- `#/explore/99999` displays the first event but leaves the bogus id in the
  address bar, so the URL misreports what is on screen. `#/explore/abc` handles
  the same situation correctly by rewriting the hash, so the fix is to make the
  out-of-range path behave like the unparseable one.

### 8. Mobile UX polish — partial (July 2026)

Measured on `main` after the content-budget work (390×844 and 375×667):

| issue | severity | status |
|---|---|---|
| Diplomatic / military badge contrast | high | **fixed** — dark ink on gold; darker military green |
| Diplomatic filter chip at 2.49:1 when active | high | **fixed** — the chips paint the same type colours behind a label; they needed the same dark ink as the badges |
| Story controls unreachable below the fold | high | **fixed** — the overlay was bounded by the sheet box, which sits ~300px past the fold, so `overflow-y` never fired. A 320×568 lost the search field and any phone in landscape lost all four type filters |
| Header title truncates to "Revoluti…" | high | **fixed** — short "Revolution" label under 768px |
| Story controls push peek prose below fold (+151 / +248px) | high | **fixed** — panel overlays the card |
| Swipe hint overlays expanded card title (z-index 750 > sheet 700) | med | **fixed** — hint sits under the sheet; dismisses on first step |
| Zoom +/- at 32px on phones | med | **fixed** — 40px under 768px. Needed the anchor's own class: Leaflet ships 30px at equal specificity and its stylesheet arrives with the lazy explore chunk, so it won on order |
| `inert` never reached the DOM | med | **fixed** — `inert={cond ? '' : undefined}` is falsy for React 19's boolean attribute. The sheet had `visibility: hidden` behind it, but the cards-mode map had nothing, so Leaflet's controls stayed focusable |
| Welcome "Open the data" under 44px tall | low | **fixed** — 44px min-height under 560px. Two `.secondary` blocks in the same media query were fighting; the later one won at 40px |
| "MAP LEGEND" heading at 3.54:1 | low | **fixed** — `#888` → `#666`, with a light slate for dark mode |
| Safe-area inset on sheet nav | low | **fixed** |
| Sticky-map scrollytelling (route 2) | redesign | still open — preference, not a bug |
| Peek Prev/Next sit below the fold | med | open — swipe is primary; expand to reach buttons. Measured: 211px past the fold at 390×844 |
| Holding an arrow key drops steps (item 3) | med | open — confirmed still live: 8 repeats at 60ms advance 2 steps |
| Status chip overlaps sheet when fully expanded | low | open — chip is year/progress, still readable |
| Filter + type chip density in story controls | med | open — usable but crowded on SE, though the panel scrolls now |
| `cursor/form-review-findings-39f3` editorial fork | process | still open — see item 5 |

Every row above was measured in a real browser, not read off the diff. The four
"fixed" rows that needed a second pass — the filter chip, the panel bound, the
zoom size and the welcome CTA — had landed as CSS that was silently losing a
specificity or source-order fight, which is why they need the notes they carry.

The form-review branch still uses a bottom sheet on mobile (sticky map is
desktop-only there) and remains far behind `main`; treat it as a reference for
editorial chrome / safe-area habits, not a merge candidate without a deliberate
rebase.

## Decisions already taken

Recorded so they are not relitigated from scratch.

**Each vector layer group gets a renderer bound to its own pane.** Do not
consolidate them back into one shared `L.svg` for the sake of fewer SVG roots.
A shared renderer puts every path in one SVG under `overlayPane`, which makes
the pane z-indexes decorative and reduces paint order to mount order — so any
layer that remounts jumps on top of the ones that did not. That is how a dark
mode toggle erased every colony border: the base layers are keyed on
`darkMode`, remounted, and re-appended the opaque land fill over them.

**The chart carries North America and the far shore of the Atlantic, not the
world.** Of 47 events, 5 are in Europe and the rest are on the eastern seaboard
or the Gulf. There is nothing in the Pacific, South America or Asia to draw. A
world basemap would be geometry paid for on every load in order to render empty
ocean.

**European geometry comes from the coarse 110m world set and is deliberately not
run through `simplifyCollection`.** Natural Earth has already generalised it;
a second Visvalingam pass shredded the Channel and the Breton and Iberian coasts
into loose triangles. It is also merged into a single silhouette before
clipping — drawn as separate country features it renders as a scatter of tiles
with parchment showing through every land border, because the chart has no
political boundaries on that side.

**North Africa is excluded from that geometry** so the clip box leaves no
straight cut anywhere a viewer could mistake for coastline.

**Connecting lines between consecutive events were removed.** Nobody travelled
Savannah → Charleston → Camden as a single march, so the segments asserted a
journey that never happened; across the ocean the line degenerated into a rubber
band from Yorktown to Paris. The year markers stay, pinned where each campaign
season opens. Note this was not a performance change — see item 2.

**"Overseas" is a longitude test, not a bounding-box test.** Asking whether an
event falls outside the seaboard rectangle misclassified Pensacola, which is
west of the frame rather than across an ocean, and flew the map to a patch of
open sea that did not contain it.

**Horizontal moves the story; vertical reads the card.** Left/right arrows and
left/right swipes step through the timeline. Up/down and vertical swipes are
reserved for scrolling the entry, which previously could not be scrolled by
keyboard at all because both axes were bound to navigation. The mouse wheel
keeps its older behaviour — it scrolls the card and only advances once the
card reaches an edge — because removing it would leave plain-mouse users with
no scroll-driven path through the story.

**The phone does not get the crossing frame.** Fitting 88° of longitude into
~390px needs zoom 2.6, below the floor, so `flyToBounds` bottomed out at 3 and
centred on open ocean with the target off the right edge. Narrow layouts fly to
the European target itself at zoom 4 instead. `atlanticBounds` is deliberately
loose to the *south* for this: lifting the target clear of the bottom sheet
moves the map centre southward, and a tight south edge clamped that lift away.

**The land silhouette is generated on wider bounds than the water.** At minZoom
the viewport is wider than `maxBounds`, so Leaflet cannot clamp the pan and the
clipper's straight cut showed as a false coastline. Land runs to -102° to beat
the viewport; lakes and rivers stay on the tighter box, because carrying them
that far cost ~770 points of geometry that is never on screen.
