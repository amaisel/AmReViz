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
