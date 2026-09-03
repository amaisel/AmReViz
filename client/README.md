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
npx playwright test   # 104 tests; boots its own server on 5174
```

There is no `npm test` script — Playwright runs through `npx`. The suite starts
its own dev server on 5174 so a `npm run dev` on 5173 can keep running beside
it. `AMREVIZ_TEST_URL` points the suite at a server you are already running.

## Layout

```
src/
  components/   ExploreView, Map, EventCard, Charts, MobileBottomSheet, …
  constants/    palette.js (colour, with measured contrast), layout.js
  data/         events.js, interludes.js, metrics.js, geo/ (generated)
  hooks/        useHashRouter, useReducedMotion, useEventImage
tests/
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
