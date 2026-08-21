# State of play

Last updated: 2026-08-21

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
npx playwright test    # 99 tests; boots its own server on 5174
```

There is no `npm test` script — Playwright runs through `npx`. The suite starts
its own dev server on port 5174 so a `npm run dev` on 5173 can keep running
alongside it. Set `AMREVIZ_TEST_URL` to point the suite at a server you are
already running instead.

It is in three files. `ux-audit.spec.js` is the older set, largely about map
framing and the mobile sheet's geometry. `ux-improvements.spec.js` covers
keyboard and assistive technology, touch-target sizes, motion preference,
routing, and the data view's click-through. `a11y-colour.spec.js` is the
colour and accessibility floor: axe over every view in both themes at both
widths, a contrast sweep across every rendered text node, chart series and
legend legibility, focus-ring visibility, and the checks that no meaning rests
on colour alone.

Every test in the latter two was checked against the code from before its fix
and observed to fail — a colour or geometry test that passes either way is
worse than none, and several did exactly that until the checks were tightened.

Five notes for anyone extending it, each of which cost a false pass or a false
failure to learn.

- `test.use({ reducedMotion })` does not reach the page in this runner;
  `page.emulateMedia({ reducedMotion })` does, and the reduced-motion block
  asserts the media query took effect before testing anything else.
- Several controls transition `all` over 0.2s, so a colour read straight after
  a click belongs to neither state. `settleTransitions` waits out every
  matching element, not just the first.
- **Read the composited background, never `backgroundColor`.** Almost nothing
  here sits on a flat opaque surface. An inactive filter chip under the pointer
  carries a `rgba(0, 0, 0, 0.05)` hover wash, which as a flat colour is nearly
  black and as a wash over parchment is barely a tint.
- **Contrast over a gradient or image is not computable from declared
  colours.** The sweep flags those separately and they are excluded; they were
  checked instead by sampling rendered pixels, using true min/max luminance
  rather than percentiles — a thin glyph is under 8% of the pixels in its box,
  so a percentile clips the ink away and compares background against
  background.
- SVG attributes carry bare hex. A `[\d.]+` regex parses `rgb()` strings and
  quietly mangles `#6FA8E8` into [6, 8, 8], which reads as near-black.

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

### 2. Type-badge contrast — fixed

Resolved 2026-08-21. White on the gold measured 2.49:1 and white on the green
4.39:1, against a 4.5:1 threshold. The second option in the old note won: the
gold keeps its hue and takes dark ink, because it is the colour of the
parchment palette and darkening it into a mustard would have cost more than it
bought. The green was darkened instead (#228B22 → #1A701A, #2E8B57 → #256F45).

The colours now live in `src/constants/palette.js`, which was the real problem
underneath: the same four hues were declared independently in `EventCard`,
`ExploreView`'s filter bar, `Map`'s legend and `HorizontalTimeline`, and had
already drifted — `military` was `#228B22` in three files and `#44A06A` in the
fourth. Fixing one would have missed the rest.

Each entry carries three values, because the colour does three jobs: `hue` for
a fill on the chart, `bg`/`fg` for text on the colour, and `ink` for the colour
as text on a page surface. That third one exposed a second failure nobody had
recorded — an inactive filter chip painted its label in the hue, which put
#C5A02F on near-white at 2.18:1, and in dark mode #2C4B7A on the dark surface
at 1.97:1.

The old note was right that the scans missed it: they all start on event 101,
which is `political`, the one type that already passed. There is now a
per-type axe sweep, plus a test that walks the palette table and fails on any
pairing under 4.5:1 in either theme. Item 10 covers the second pass, which
found what this one had missed.

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

### 6. Reversing direction inside ~300ms drops the second step — fixed

Resolved 2026-08-21. The old note's suspect was right in outline and wrong in
detail. It is not the `hashchange` round trip: `setView` sets React state
synchronously as well as writing the hash, and that state came straight back
down as `initialEventId`. Every step therefore re-issued its own id as an
instruction to go there a frame or two later, and a reversal inside that
window lost to the echo of the step before it.

Measured before the fix, right-then-left over five trials at each gap:
0ms 2/5 wrong, 50ms 3/5, 100ms 5/5, 200ms 0/5, 400ms 0/5. After: 0/5 at every
gap.

The origin now travels with the route rather than beside it — `useHashRouter`
returns a `fromStory` flag, and the consumer forwards an id only when it came
from outside the story. A `useRef` was tried first and is not sufficient: two
steps can land in one batch, the ref holds only the newer of the two, and the
effect for the older one then reads it and concludes the id was external. That
attempt made the 0ms case worse, 5/5 wrong.

`hashchange` needed handling too, since every write comes back as an event
naming the route already held. The handler bails when the parsed route equals
the current one, which drops echoes without counting them — two writes in one
batch produce two events that both read the second hash, and nothing in the
event distinguishes them.

The two tests that worked around this with an explicit settle no longer need
to, and `ux-improvements.spec.js` pins the behaviour at 0, 60 and 120ms.

### 7. Nits — the deep-link one is fixed

Resolved 2026-08-21, and it was broader than recorded. Both `#/explore/99999`
and `#/explore/abc` rewrite correctly on a *cold* load — the story's
mount-time sync writes the real id because nothing has been announced yet.
Neither did on a *live* navigation, which is the case a reader actually hits:
paste a bad id into a running page and the address bar kept it while the screen
carried on showing the previous event.

Split by who can answer the question. Ids are positive integers, so `abc`,
`-3` and `0` are syntax the router rejects on its own, stripping the sub-part.
Whether a well-formed id names a real event only the story knows, so
`ExploreView` re-announces the event on screen when a deep link matches
nothing. A third path was needed for the result — `#/explore` with no id at
all — so the story now re-asserts whenever the route names no event, which
also covers arriving from the data view.

All four bogus routes are tested cold and live.

### 8. Accessibility and touch — fixed, and worth not regressing

Resolved 2026-08-21. Eight things, none of which were on this list before.

**Thirty phantom tab stops.** Leaflet stamps `role="button"` and
`tabindex="0"` on every marker icon while its `keyboard` option is on, and
`interactive: false` does not stop it — that option governs mouse handlers.
So a keyboard reader tabbed through `MA`, `NY`, `1776`, `ATLANTIC OCEAN` and
26 more decorative labels before reaching a marker that does anything. Total
focusable elements on event 16 went 90 → 60. Any new decorative `Marker`
needs `keyboard={false}`; a test counts them.

**No skip link.** Added, as a `<button>` rather than an `<a href="#…">`:
routing lives in the hash here, and following such a link rewrites it to
`#main-content`, which parses as an unknown view and drops the reader on the
welcome screen.

**Steps were silent.** Moving through the story repaints the map and swaps the
card with nothing announced. There is now a polite live region naming the
event, its position and its year.

**`prefers-reduced-motion` was honoured on the welcome screen only.**
Everything else moved: a 2.4s Leaflet flight between events, a 3D card swing,
the sheet's spring and its one-off bounce, the view crossfade, and the active
marker's endless pulse. `src/hooks/useReducedMotion.js` is the shared answer —
Framer ships its own, but the two cases that matter most are imperative
(Leaflet, the sheet's animation controls) and are not Framer's to answer.
Measured on a step: 7 distinct map transforms → 1.

**Touch targets.** On a 390px phone the view toggle was 60x22 and 42x22, the
theme toggle 32x32, the speed control 30x22, the preset chips 22px tall, the
hint dismiss 18x18, the map's only zoom buttons 30x30, and the data view's
source citations 19px. All are now at least 40px. Two notes: the zoom rule
needs a `.leaflet-touch` prefix, because Leaflet's own selector has equal
specificity and loads after `App.css`; and the enlarged buttons collided with
the progress chip, which is why the chip is right-aligned on touch. Event
markers keep their drawn size — the depth-of-field effect is doing real work —
and get a 44px hit area from a pseudo-element on coarse pointers only.

**Stepping the story on a phone needed a swipe or nothing.** At peek the card
cannot scroll, so the Prev/Next pair at its foot sat permanently below the
fold on every event, leaving the swipe — taught by a hint that dismisses
itself after six seconds — as the only way forward. The sheet header is now a
four-column grid carrying prev, the drag handle, next, and the controls
disclosure, all reachable at both snap points. The card's own pair is hidden
inside the sheet: two controls with the same accessible name is worse than
one, and that pair never earned its keep there.

**The desktop filters panel was translucent.** It opens on top of the story
card, and at 0.75 alpha the card's prose read straight through it — a blur
softens text but does not hide it. Now opaque, and sized to its content
rather than capped at 55vh, which had put a scrollbar on a six-row panel at
every ordinary window height.

**The shortcuts overlay was a dialog in appearance only** — no `role`, no
accessible name, no close button, no focus trap, no focus restore. It closed
on Escape or a backdrop click, neither discoverable, and neither available on
a phone, where `?` cannot be typed. It is now a real modal with a visible
close control that hands focus back to whatever opened it.

### 9. Two dead affordances in the data view — fixed

Resolved 2026-08-21, found while checking that navigation still worked after
the routing change. Both are Recharts 3 upgrade fallout.

`CasualtiesChart` read `state.activePayload[0].payload.id` in its chart-level
`onClick`. Recharts 3 no longer passes `activePayload` there — it reports
`activeIndex` and `activeLabel` — so the guard never matched and the chart's
own instruction, "Click a bar to inspect its definition", pointed at nothing.

`ArmyChart` put `onClick` on its two `<Area>`s and advertised it with
`cursor: pointer` on the dots. Recharts 3 fires an Area's `onClick` for the
filled shape only, so the dots were dead. The handler moved to the chart,
where the whole column is the target rather than an 11px circle, and the
takeaway line now says the year is clickable.

Worth knowing when driving these in a test: scroll the chart, not the mark.
Recharts re-renders on the resize that scrolling triggers, and a bar resolved
beforehand detaches mid-action.

### 10. Colour and the rest of the accessibility floor — fixed

Resolved 2026-08-21, in a second pass that went looking for what the badge fix
in item 2 had missed. axe reports **0 violations across 32 page states** (every
view, both themes, both widths, all impact levels — it was 2 moderate), and a
sweep of every rendered text node found 13 contrast failures axe does not see.

**The charts were theme-blind.** `Charts.jsx` painted every series in its
light-theme hue whatever the theme, so in dark mode the navy area sat on
near-black. This is not a nit: the series was invisible and the chart
unreadable. The legend labels, which Recharts paints in the series colour,
measured 1.15:1 for "In Continental pay" and 1.62:1 for "Imports from
England"; in light mode the gold label was 2.41:1 while the same gold was
perfectly legible as a line.

Two separate fixes, because they are two separate problems. Series colours got
a `CHART_SERIES` table in the palette with a dark variant, each value clearing
3:1 against the card it is drawn on (WCAG 1.4.11). And legend labels and
tooltip rows now render in body ink with the colour carried by a swatch beside
them — which is what lets the series colours be chosen for the graphic
threshold rather than the much stricter text one.

**`#888` was pasted into fourteen rules.** 3.54:1 on white, 3.11:1 on the
parchment — under AA everywhere it appeared, including the story's own
progress counter, the map legend title and the battle comparison labels. One
instance had already been fixed in place, with a comment recording the ratio;
the other thirteen had not. They are now one token with a dark counterpart.

**Nothing rests on colour alone any more.** Simulating deuteranopia and
protanopia over the palette put `battle` and `military` 35–40 apart in RGB —
effectively the same colour — and the dark chart trio's gold and red 57 apart.
The event types were already safe, because every one carries a distinct SVG
symbol as well as a hue. The charts were not: the stacked areas and the trade
lines were told apart by colour and nothing else. They now carry stroke
patterns, and the Crown bars a diagonal hatch. On the map, which side held a
place was a fill colour and nothing else, so it is now said in the marker's
accessible name — `Siege of Yorktown, 1781, American-held`.

**The focus ring was `2px solid currentColor`** — the button's own text
colour, chosen to contrast with the button, which says nothing about the page
behind it where the ring is drawn. On an active filter chip in light mode that
was white on parchment, 1.14:1; on the dark view toggle, navy on the dark
header, 1.23:1. A keyboard user simply lost the cursor. It is now a two-tone
ring with its own token, and `.app-header` overrides that token because the
masthead is deep navy in *both* themes — the ring follows the surface it lands
on, not the page's theme.

**The charts had no text alternative.** An SVG inside a labelled region tells a
screen reader that a chart exists and then offers nothing. Each one now
carries a visually hidden table of the same numbers. Note `pointer-events:
none` on `.sr-only`: a `display: table` ignores the `width: 1px`, so those
tables are full-size boxes positioned over the chart, and without it they
swallow clicks meant for a bar.

Also fixed here: the two axe findings (a heading level skipped in the data
view, a complementary landmark nested inside another on the welcome screen),
`BattleComparison`'s dark-mode reds at 2.55:1, and Leaflet's disabled zoom
button at 1.75:1.

Four contrast readings are deliberately left alone. Leaflet's zoom control at
the end of its range is an inactive control, exempt under 1.4.3 and raised
from 1.75:1 to 3.37:1 so it reads as unavailable rather than broken; and the
welcome screen's decorative `◇` clears the 3:1 graphic threshold. The sweep
also flags anything sitting over a gradient, where declared colours do not
describe what is rendered — those were checked by sampling pixels instead and
measure 10.7:1 to 13.0:1.

### 11. Still open, unchanged

- The mobile sticky-map redesign (route 2 under item 1).
- Holding an arrow key still drops steps (item 3) — the marker layer, untouched
  here.
- The `metrics` chunk (item 4), now 385.86 kB after the chart work.
- `cursor/fix-review-findings-39f3` (item 5).
- `HorizontalTimeline.jsx` and `Map.jsx`'s `MapLegend` are both dead — defined,
  never rendered. `MapLegend` now reads from the palette so it cannot drift
  again; `HorizontalTimeline` still carries its own copy of the four colours,
  including the `#44A06A` that no other file uses. Deleting both is the honest
  fix and was left alone as out of scope.

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
