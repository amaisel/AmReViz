# State of play

Last updated: 2026-07-28

A living note on where AmReViz stands and what is worth doing next. Every claim
here was measured rather than estimated; where a number appears, the method is
given so it can be re-checked when it goes stale.

## How to work here

`main` is protected and `CODEOWNERS` assigns every path to `@amaisel`, so all
changes land through a PR with a review — including single-line docs edits.

```bash
cd client
npm run dev            # vite, port 5173
npm run lint           # eslint, must be clean
npm run build          # must be clean
npx playwright test    # 13 tests; boots its own server on 5174
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

### 1. Four of the eight type-badge colours fail WCAG contrast

`EventCard.jsx` paints the type badge white-on-colour. Measured ratios against
white, both themes:

| type | light | dark |
|---|---|---|
| battle | 10.92 | 6.95 |
| political | 15.39 | 8.77 |
| **diplomatic** | **2.49** | **1.77** |
| **military** | **4.39** | **4.25** |

The threshold is 4.5:1. Confirmed independently by axe against a live page
(`ratio=2.48 need=4.5:1` on a diplomatic event).

This is long-standing, but it got more visible in July 2026: adding the London
and Paris events took the diplomatic count from 2 to 5, so the worst-failing
badge now appears on roughly one event in nine. The a11y suite does not catch it
because those scans start on event 101, which is `political`.

Cheapest real fix is darkening the two colours until they pass; the alternative
is dark text on the existing gold, which suits the parchment palette better.
Small change, and worth pairing with a scan that visits one event of each type.

### 2. Holding an arrow key still drops steps

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

### 3. The `metrics` chunk is 381.92 kB (112.58 kB gzip)

Recharts, pulled in whole. It is the largest asset in the build by some margin
and it only serves the data view. Splitting the chart components behind the
existing lazy-route boundary, or moving to a lighter chart library, would take
it off the initial path for anyone who never opens that view.

### 4. Unmerged parallel direction on `cursor/fix-review-findings-39f3`

Seven commits from 2026-07-20 redesigning the visualisation as editorial
scrollytelling. It forked from `6ab6c3f` on 2026-07-08 and was never merged;
`main` took the bottom-sheet route instead and has moved several major commits
past it. It is the only surviving copy of that work.

Either rebase it deliberately or delete it — leaving it to rot at an ever-growing
distance from `main` is the one outcome with no upside.

### 5. Nits

- `#/explore/99999` displays the first event but leaves the bogus id in the
  address bar, so the URL misreports what is on screen. `#/explore/abc` handles
  the same situation correctly by rewriting the hash, so the fix is to make the
  out-of-range path behave like the unparseable one.

## Decisions already taken

Recorded so they are not relitigated from scratch.

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
