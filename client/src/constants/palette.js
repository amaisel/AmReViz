// One source of truth for the four event-type colours.
//
// The same four hues were declared independently in EventCard, ExploreView's
// filter bar, the map legend and the charts, and they had already drifted:
// `military` was #228B22 in three files and #44A06A in a fourth. Worse, two of
// the badge pairings failed WCAG AA — white on the gold measured 2.49:1 and
// white on the green 4.39:1, against a 4.5:1 threshold.
//
// Three values, because the colour does three different jobs:
//
//   hue  the identity colour — a fill or stroke on the chart, where nothing is
//        written on top of it and contrast is not the constraint.
//   bg   + fg: the pairing for text ON the colour — badges, active filter
//        chips, legend swatches with a label inside.
//   ink  the colour as text or an icon ON a page surface — an inactive filter
//        chip, a legend caption. Dark mode needed its own: #A33030 on the dark
//        surface measured 2.49:1 and #2C4B7A 1.97:1, which is what an inactive
//        chip was painted in.
//
// Every pairing below is verified by a test rather than by eye; see
// 'the event-type palette meets WCAG AA in both themes' in the Playwright
// suite, which walks this table and fails on anything under 4.5:1.
//
// The gold keeps its hue and takes dark ink instead of being darkened into a
// mustard: it is the colour of the parchment palette, and losing it to a
// contrast fix would cost more than it bought.

const INK_ON_GOLD = '#2B1D00';

export const EVENT_TYPES = {
  battle: {
    label: 'Battle',
    plural: 'Battles',
    light: { hue: '#7A1212', bg: '#7A1212', fg: '#FFFFFF', ink: '#7A1212' },
    dark: { hue: '#A33030', bg: '#A33030', fg: '#FFFFFF', ink: '#D98080' },
  },
  political: {
    label: 'Political',
    plural: 'Political',
    light: { hue: '#0A244A', bg: '#0A244A', fg: '#FFFFFF', ink: '#0A244A' },
    dark: { hue: '#2C4B7A', bg: '#2C4B7A', fg: '#FFFFFF', ink: '#8BA3C4' },
  },
  diplomatic: {
    label: 'Diplomatic',
    plural: 'Diplomatic',
    light: { hue: '#C5A02F', bg: '#C5A02F', fg: INK_ON_GOLD, ink: '#6E5508' },
    dark: { hue: '#E0C060', bg: '#E0C060', fg: INK_ON_GOLD, ink: '#E0C060' },
  },
  military: {
    label: 'Military',
    plural: 'Military',
    // Darkened from #228B22 / #2E8B57, which measured 4.39:1 and 4.25:1.
    light: { hue: '#1A701A', bg: '#1A701A', fg: '#FFFFFF', ink: '#1A701A' },
    dark: { hue: '#256F45', bg: '#256F45', fg: '#FFFFFF', ink: '#4CAF7D' },
  },
};

// Who prevailed, as printed on the event card. `indecisive` shares the gold's
// dark-ink treatment: white on it measured 4.22:1 light and 1.77:1 dark.
export const OUTCOMES = {
  american: {
    label: 'American victory',
    light: { bg: '#0A244A', fg: '#FFFFFF' },
    dark: { bg: '#2C4B7A', fg: '#FFFFFF' },
  },
  british: {
    label: 'British victory',
    light: { bg: '#7A1212', fg: '#FFFFFF' },
    dark: { bg: '#A33030', fg: '#FFFFFF' },
  },
  indecisive: {
    label: 'Inconclusive',
    light: { bg: '#C5A02F', fg: INK_ON_GOLD },
    dark: { bg: '#E0C060', fg: INK_ON_GOLD },
  },
  allied: {
    label: 'Allied victory',
    light: { bg: '#1F6F46', fg: '#FFFFFF' }, // 6.14:1
    dark: { bg: '#3E9B6B', fg: '#0B1F14' }, // 5.00:1
  },
};

// Chart series.
//
// A different job again from the badges above, and the reason it needs its own
// table: `Charts.jsx` painted every series in the light-theme hue whatever the
// theme, so in dark mode the navy area sat on near-black at 1.15:1 — not a
// contrast nit but an unreadable chart. WCAG 1.4.11 asks 3:1 for a graphic
// that carries meaning, and each value below clears it against the card it is
// drawn on (#FCFBFA light, #14191F dark).
//
// Recharts paints legend labels and tooltip rows in the series colour by
// default. That is what dragged the gold down to 2.41:1 as *text* while it was
// perfectly legible as a line. The charts now render those labels in body ink
// and let the swatch carry the colour, so these values only ever have to
// satisfy the graphic threshold.
//
// `dash` is not decoration: red and green collapse under deuteranopia, and the
// dark trio's gold and red sit 57 apart in RGB after simulation. A stroke
// pattern and a dot shape say the same thing colour does, without colour.
export const CHART_SERIES = {
  american: {
    light: { hue: '#0A244A', dash: null, shape: 'circle' }, // 14.89:1
    dark: { hue: '#6FA8E8', dash: null, shape: 'circle' }, //  7.10:1
  },
  militia: {
    // #C5A02F measured 2.41:1 on the light card — under the graphic threshold.
    light: { hue: '#B08820', dash: '6 4', shape: 'square' }, // 3.18:1
    dark: { hue: '#E0C060', dash: '6 4', shape: 'square' }, //  9.99:1
  },
  british: {
    light: { hue: '#7A1212', dash: '2 5', shape: 'triangle' }, // 10.57:1
    dark: { hue: '#E87B96', dash: '2 5', shape: 'triangle' }, //  6.48:1
  },
};

export const chartSeries = (name, darkMode) =>
  (CHART_SERIES[name] ?? CHART_SERIES.american)[darkMode ? 'dark' : 'light'];

// Body and secondary ink for chart furniture — axis ticks, legend labels,
// tooltip rows. Replaces the `#888` that was pasted into fourteen rules and
// measured 3.54:1 on white, 3.11:1 on the parchment.
export const CHART_INK = {
  light: { body: '#3F4652', muted: '#5C6472' },
  dark: { body: '#C9D1D9', muted: '#9BA6B4' },
};

export const chartInk = (darkMode) => CHART_INK[darkMode ? 'dark' : 'light'];

// The two sides, as drawn on the map. Fills behind a white symbol, not text.
export const SIDES = {
  american: '#1e3a5f',
  british: '#8b2323',
};

export const typeTheme = (type, darkMode) =>
  (EVENT_TYPES[type] ?? EVENT_TYPES.political)[darkMode ? 'dark' : 'light'];

export const outcomeTheme = (outcome, darkMode) =>
  OUTCOMES[outcome]?.[darkMode ? 'dark' : 'light'];

export const typeLabel = (type) => EVENT_TYPES[type]?.label ?? '';

export const outcomeLabel = (outcome) => OUTCOMES[outcome]?.label ?? '';
