# client

The whole application. There is no backend — events and metrics are static
modules and the build output is a static site.

Start at the [root README](../README.md) for what this project is, and
[`ROADMAP.md`](../ROADMAP.md) for the state of the work and the decisions
already taken.

## Commands

```bash
npm install
npm run dev           # vite, port 5173
npm run lint          # eslint, must be clean
npm run build         # must be clean
npm run preview       # serve the production build
npm test              # the whole suite, 151 tests; boots its own server on 5174
npm run walkthrough   # just the end-to-end walk through the app
```

The suite starts its own dev server on 5174 so a `npm run dev` on 5173 can keep
running beside it. `AMREVIZ_TEST_URL` points it at a server you are already
running instead.

`npm run walkthrough` is the one to reach for after a change: it enters from
the welcome screen, steps through all 47 events and 4 interludes in order,
works every control in the explore view, reads every chart in the data view,
checks deep links and history, and repeats the essentials on a phone viewport —
failing on any uncaught exception or console error along the way. It takes
about a minute. `npm run walkthrough:shots` leaves a screenshot of each stop in
`test-results/walkthrough/`; `npm run walkthrough:headed` runs it in a visible
browser.

## Layout

```
src/
  components/   ExploreView, Map, EventCard, Charts, MobileBottomSheet, …
  constants/    palette.js (colour, with measured contrast), layout.js
  data/         events.js, interludes.js, metrics.js, geo/ (generated)
  hooks/        useHashRouter, useReducedMotion, useEventImage
tests/
  helpers.js                what the specs share: navigation, waits, colour
  walkthrough.spec.js       the end-to-end walk: every view, every event
  audit-fixes.spec.js       the explore and data bugs from the audit pass
  ux-audit.spec.js          map framing, mobile sheet geometry
  ux-improvements.spec.js   keyboard, touch, motion, routing, large screens
  a11y-colour.spec.js       axe, contrast sweep, focus, colour-independence
scripts/
  build-geo-data.mjs        regenerates src/data/geo/ from Natural Earth
  fetch-event-images.mjs    refreshes public/events/
```

## Before changing anything visual

`src/constants/palette.js` is the single source of truth for colour. Every
entry records the contrast ratio it was chosen for, and a test walks the table
and fails on anything under threshold. The four hues used to live in four
components and had already drifted — that is what the module exists to prevent.

Map geometry under `src/data/geo/` is generated. Rerun
`node scripts/build-geo-data.mjs` rather than editing it.
