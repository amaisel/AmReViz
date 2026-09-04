# Accessibility

This app targets **WCAG 2.2 Level AA**. The claims below are tested rather than
asserted; each one names the test that holds it up, in
`client/tests/a11y-colour.spec.js` and `client/tests/ux-improvements.spec.js`.

If you hit a barrier that is not listed under [Known
gaps](#known-gaps), please open an issue — it is a bug, not a limitation.

## What is covered

### Keyboard

Everything is reachable and operable from the keyboard. A skip link is the first
tab stop on the story and data views. The keyboard-shortcut dialog traps focus
while open and returns it to whatever opened it.

| Key | Does |
|---|---|
| `←` `→` | Previous / next step |
| `↑` `↓` | Scroll the event card |
| `Space` | Play / pause |
| `C` / `Esc` | Enter / leave cards focus mode |
| `D` | Toggle dark mode |
| `1` `2` | Explore / Data |
| `?` | Shortcuts |

The map used to put 30 decorative labels — colony abbreviations, campaign years,
"ATLANTIC OCEAN" — into the tab order ahead of the markers that actually do
something, because Leaflet marks every marker focusable by default. Those are
gone; tabbing through the map now reaches events only.

### Screen readers

Each step announces itself through a polite live region, naming the event, its
position in the sequence, its year and its location. Map markers carry an
accessible name that includes the year and which side held the place. Every
chart has a visually hidden data table carrying the same numbers, because an SVG
in a labelled region otherwise announces that a chart exists and then offers
nothing.

### Colour and contrast

All text meets AA — 4.5:1, or 3:1 for large text — in both themes. Graphics that
carry meaning meet 3:1 per WCAG 1.4.11.

This is verified two ways, because one is not enough. axe runs over every view
in both themes at both widths (32 page states, all impact levels). Separately, a
sweep walks every rendered text node, composites the translucent layers behind
it, and measures the real ratio — which catches what axe skips: anything over a
gradient, and anything the charting library draws. When that sweep was first
run against a codebase axe called clean, it found 13 failures, the worst of them
a chart legend at 1.15:1.

**No meaning is carried by colour alone.** Event types have distinct symbols as
well as hues. Chart series have stroke patterns and a hatch fill as well as
colours. A map marker's side is in its accessible name. This matters here
specifically: simulating deuteranopia puts the `battle` red and `military` green
about 37 apart in RGB — for a reader with that vision they are the same colour.

**Focus is always visible.** The ring is a two-tone indicator with its own
colour token, not `currentColor` — which is the button's text colour, chosen to
contrast with the button and saying nothing about the page behind it, where the
ring is actually drawn.

### Motion

`prefers-reduced-motion: reduce` is honoured throughout, including the parts
that are not CSS: Leaflet's flights between events become jumps, the bottom
sheet's spring becomes a short tween, the marker's pulse ring stops, the card's
3D swing becomes a crossfade, and the sheet's one-off "this drags" bounce does
not play at all. Transitions that communicate a change of state are kept, at
reduced duration; the ones that are decoration are dropped.

### Touch and pointer

Interactive targets are at least 44×44 CSS pixels on touch, exceeding the 24×24
of WCAG 2.2 Target Size (Minimum). Map markers keep their drawn size — the
chart's sense of depth depends on it — and get an invisible 44px hit area on
coarse pointers instead.

### Structure

One `h1` per view and no skipped heading levels. Landmarks are not nested.
Form controls are labelled. The document declares `lang="en"`.

## Known gaps

Honest list. These are real and not yet fixed.

- **Holding an arrow key drops steps.** Each step costs roughly 45–115ms and
  key repeat outruns it, so below about 150ms between presses a meaningful
  share of presses never land. Single presses and rapid reversals are correct;
  it is sustained key repeat that suffers. The cause is the marker layer
  rebuilding on every step. Tracked as item 3 in `ROADMAP.md`.
- **Line length below 1600px.** The story column runs to about 80 characters at
  1440px, above the comfortable 45–75. Screens at 1600px and above scale the
  type and cap the column; narrower ones do not yet, because there is no
  vertical room to spend on a larger font without pushing the card below the
  fold.
- **The map is not a substitute for the text.** Spatial relationships shown on
  the chart — how far apart two places are, which way a campaign moved — are
  not restated in prose. Each event's location is named, but the geography
  itself is visual.
- **No high-contrast or forced-colours mode** has been specifically tested.

## Testing it yourself

```bash
cd client
npx playwright test tests/a11y-colour.spec.js
```

The colour sweep excludes two categories, both deliberately and both documented
in the spec: controls at the end of their range, which WCAG 1.4.3 exempts, and
text over a gradient, where declared colours do not describe what is rendered.
The second group was verified separately by sampling rendered pixels — using
true minimum and maximum luminance, because a thin glyph is under 8% of the
pixels in its box and a percentile clips the ink away entirely, comparing
background against background and reporting a comfortable pass as a 1.12:1
failure.
