# Cards Focus Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Explore a taller screen-relative desktop event card and a shared `map` | `cards` focus mode (explicit button + `C`/`Esc`) that hides the map so users can read cards full-screen on desktop and mobile.

**Architecture:** `ExploreView` owns `viewMode` and a root class (`view-mode-map` / `view-mode-cards`). CSS hides the map without unmounting it; `Map` invalidates Leaflet size when shown again. One Focus/Show map button lives in shared `controlsContent`. `MobileBottomSheet` accepts `locked` to force full height while in cards mode.

**Tech Stack:** React 19, Vite, Framer Motion, react-leaflet / Leaflet, existing `App.css` explore layout

**Spec:** `docs/superpowers/specs/2026-07-08-cards-focus-mode-design.md`

## Global Constraints

- `viewMode` is session-only React state — no URL or localStorage
- Hide the map with CSS; do **not** unmount `<Map>` (preserve camera)
- Toggle lives in shared `controlsContent` (not `EventCard`)
- Labels: **“Focus cards”** / **“Show map”**
- Keyboard: `C` toggles; `Escape` exits cards only when help overlay is closed
- In cards mode, disable explore wheel→event navigation so card content can scroll
- No drag-to-expand on desktop; no three-size snap ladder
- Repo has no component unit-test harness — verify each task with `npm run build` / `npm run lint` in `client/` plus the listed manual browser checks

---

## File structure

| File | Responsibility |
|------|----------------|
| `client/src/components/ExploreView.jsx` | `viewMode` state, root class, Focus button, keyboard, wheel gate, filter chrome, pass `locked` / `mapVisible` |
| `client/src/App.css` | Taller desktop card, cards-mode full-viewport layout, map hide rules, control/filter placement |
| `client/src/components/MobileBottomSheet.jsx` | `locked` prop: force full, no peek-on-event-change, no collapse while locked |
| `client/src/components/Map.jsx` | `mapVisible` → `invalidateSize`; align `coveredRatio` with ~48vh desktop card |
| `client/src/components/KeyboardShortcuts.jsx` | Document `C` and `Esc` (exit cards) |

---

### Task 1: Taller desktop card (map mode) + camera cover ratio

**Files:**
- Modify: `client/src/App.css` (`.desktop-event-card`, interlude variant, landscape override)
- Modify: `client/src/components/Map.jsx` (`coveredRatio`)

**Interfaces:**
- Consumes: none
- Produces: desktop map-mode card heights `max(48vh, 320px)` / interludes `max(56vh, 360px)`; `coveredRatio` desktop `0.48`

- [ ] **Step 1: Update desktop card max-heights**

In `client/src/App.css`, change:

```css
.desktop-event-card {
  /* ... */
  max-height: max(48vh, 320px);
  /* ... */
}

.desktop-event-card:has(.data-interlude-card) {
  max-height: max(56vh, 360px);
}
```

In the `@media (max-height: 500px) and (orientation: landscape)` block, change the hardcoded `35vh` to:

```css
.desktop-event-card {
  max-height: max(48vh, 200px);
  padding: 10px 16px 8px;
}
```

- [ ] **Step 2: Align map camera cover ratio with the taller card**

In `client/src/components/Map.jsx`, update:

```js
const coveredRatio = isMobile ? 0.55 : 0.48;
```

- [ ] **Step 3: Verify build**

Run: `cd client && npm run build`

Expected: build succeeds.

- [ ] **Step 4: Manual check**

Run: `cd client && npm run dev` — open Explore on a desktop-width viewport.

- Default event card is clearly taller (~half the screen) with map still visible above.
- Open a data interlude: card is a bit taller still, chart usable.
- Narrow landscape (or DevTools short height): card is not stuck at the old 35vh feel.

- [ ] **Step 5: Commit**

```bash
git add client/src/App.css client/src/components/Map.jsx
git commit -m "$(cat <<'EOF'
feat: size desktop event card to ~48vh of the screen

Give the map-mode bottom card more reading room and aim the map camera at the visible strip above it.
EOF
)"
```

---

### Task 2: `viewMode` state, map hide CSS, Leaflet `invalidateSize`

**Files:**
- Modify: `client/src/components/ExploreView.jsx`
- Modify: `client/src/App.css`
- Modify: `client/src/components/Map.jsx`

**Interfaces:**
- Consumes: Task 1 card heights
- Produces:
  - `viewMode: 'map' | 'cards'` in `ExploreView` (default `'map'`)
  - Root classes `view-mode-map` | `view-mode-cards`
  - `Map` prop `mapVisible: boolean` (true when `viewMode === 'map'`)
  - CSS that hides `.scrolly-map-container` in cards mode without unmounting Map

- [ ] **Step 1: Add `InvalidateOnVisible` inside Map**

Near other `useMap` helpers in `client/src/components/Map.jsx`, add:

```jsx
function InvalidateOnVisible({ mapVisible }) {
  const map = useMap();
  useEffect(() => {
    if (!mapVisible) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [mapVisible, map]);
  return null;
}
```

Add prop to `Map` (default `true`):

```js
export default function Map({
  // ...existing props
  timelineOpen = false,
  mapVisible = true,
}) {
```

Render inside `MapContainer` (alongside existing map children):

```jsx
<InvalidateOnVisible mapVisible={mapVisible} />
```

- [ ] **Step 2: Wire `viewMode` in ExploreView**

In `ExploreView.jsx`, add state and toggle helper:

```js
const [viewMode, setViewMode] = useState('map'); // 'map' | 'cards'

const toggleViewMode = useCallback(() => {
  setViewMode((prev) => (prev === 'map' ? 'cards' : 'map'));
}, []);
```

Update the root element className:

```jsx
<div
  className={`scrollytelling-view ${darkMode ? 'dark' : ''} view-mode-${viewMode}`}
  ref={viewRef}
>
```

On the map container:

```jsx
<div
  className="scrolly-map-container"
  ref={mapContainerRef}
  aria-hidden={viewMode === 'cards'}
>
  <Map
    /* ...existing props */
    mapVisible={viewMode === 'map'}
  />
</div>
```

Do **not** conditionally unmount `<Map>`.

- [ ] **Step 3: CSS — hide map + full-viewport desktop card in cards mode**

Append to `client/src/App.css` (near explore / desktop-event-card section):

```css
/* ===== CARDS FOCUS MODE ===== */
.scrollytelling-view.view-mode-cards .scrolly-map-container {
  visibility: hidden;
  pointer-events: none;
}

.scrollytelling-view.view-mode-cards .desktop-event-card {
  top: 0;
  bottom: 0;
  max-height: none;
  border-radius: 0;
  z-index: 600;
}

.scrollytelling-view.view-mode-cards .desktop-event-card:has(.data-interlude-card) {
  max-height: none;
}

.scrollytelling-view.view-mode-cards .explore-controls.desktop-controls {
  bottom: 0;
  z-index: 700;
}

.scrollytelling-view.view-mode-cards .filters-panel {
  bottom: 64px;
  z-index: 700;
}
```

(Desktop controls already sit at `bottom: 0` under the card; full-viewport card uses `top: 0; bottom: 0` with the controls bar remaining reachable at the bottom.)

- [ ] **Step 4: Temporary toggle for verification**

Temporarily add a button at the top of `controlsContent` (will be finalized in Task 3):

```jsx
<button
  type="button"
  className={`explore-btn ${viewMode === 'cards' ? 'active' : ''}`}
  onClick={toggleViewMode}
  aria-label={viewMode === 'map' ? 'Focus cards' : 'Show map'}
>
  {viewMode === 'map' ? 'Focus cards' : 'Show map'}
</button>
```

- [ ] **Step 5: Verify build + manual check**

Run: `cd client && npm run build` — expect success.

Manual (`npm run dev`, desktop width):

- Click Focus cards → map gone, card fills viewport, year chip + controls still visible.
- Click Show map → map returns at the same event, fills container (no grey/blank strip — `invalidateSize` worked).
- Advance events while in cards → stay in cards.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/ExploreView.jsx client/src/components/Map.jsx client/src/App.css
git commit -m "$(cat <<'EOF'
feat: add map|cards viewMode with hidden map and invalidateSize

Introduce session viewMode so Explore can hide the Leaflet map without unmounting it and restore size when returning to map mode.
EOF
)"
```

---

### Task 3: Focus button chrome + filter panel map-only bits

**Files:**
- Modify: `client/src/components/ExploreView.jsx` (`controlsContent`, `filtersPanelContent`)

**Interfaces:**
- Consumes: `viewMode`, `toggleViewMode` from Task 2
- Produces: polished Focus/Show map `explore-btn` in shared controls; colony fill + map legend hidden when `viewMode === 'cards'`

- [ ] **Step 1: Finalize Focus button in `controlsContent`**

Place it after Search (end of the shared row), with an icon consistent with other explore buttons:

```jsx
<span className="controls-divider" />

<button
  type="button"
  className={`explore-btn ${viewMode === 'cards' ? 'active' : ''}`}
  onClick={toggleViewMode}
  aria-label={viewMode === 'map' ? 'Focus cards' : 'Show map'}
>
  {viewMode === 'map' ? (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="4 14 4 20 10 20" />
        <polyline points="20 10 20 4 14 4" />
        <line x1="14" y1="10" x2="21" y2="3" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
      <span>Focus cards</span>
    </>
  ) : (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
      <span>Show map</span>
    </>
  )}
</button>
```

(Wrap label text in `<span>` so the existing landscape rule `.explore-btn span { display: none }` icon-only behavior keeps working.)

Remove any temporary duplicate from Task 2.

- [ ] **Step 2: Hide map-only filter chrome in cards mode**

In `filtersPanelContent`, wrap the colony checkbox and map legend:

```jsx
{viewMode === 'map' && (
  <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
    <input
      type="checkbox"
      checked={fillColonies}
      onChange={() => setFillColonies(!fillColonies)}
    />
    Color colonies
  </label>
)}
{viewMode === 'map' && (
  <div className="filters-legend-section">
    {/* existing legend markup unchanged */}
  </div>
)}
```

Keep presets + `FilterBar` always visible.

- [ ] **Step 3: Manual check**

- Desktop + mobile width: Focus button appears in the shared controls row; active state when in cards.
- In cards mode, open Filter: no “Color colonies” / “Map Legend”; type filters still work.
- Landscape short viewport: button shows icon only (label span hidden).

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ExploreView.jsx
git commit -m "$(cat <<'EOF'
feat: add Focus cards control and hide map-only filter chrome

Expose the shared map|cards toggle in explore controls and drop colony/legend options while reading cards-only.
EOF
)"
```

---

### Task 4: Keyboard (`C` / `Escape`) + shortcuts help + wheel gate

**Files:**
- Modify: `client/src/components/ExploreView.jsx` (keydown + wheel effects)
- Modify: `client/src/components/KeyboardShortcuts.jsx`

**Interfaces:**
- Consumes: `viewMode`, `setViewMode` / `toggleViewMode`
- Produces: `C` toggles mode; `Escape` exits cards only if `.shortcuts-overlay` is absent; wheel→event handler skipped when `viewMode === 'cards'`

- [ ] **Step 1: Extend ExploreView keydown handler**

In the existing `handleKeyDown` effect, add `viewMode` / `toggleViewMode` to the dependency array and handle keys after the input guard:

```js
if (e.key === 'c' || e.key === 'C') {
  e.preventDefault();
  toggleViewMode();
  return;
}

if (e.key === 'Escape' && viewMode === 'cards') {
  if (document.querySelector('.shortcuts-overlay')) return;
  e.preventDefault();
  setViewMode('map');
  return;
}
```

Keep existing Space / arrow behavior unchanged.

- [ ] **Step 2: Gate the wheel handler**

At the start of `handleWheel` (inside the wheel `useEffect`), bail when in cards mode:

```js
const handleWheel = (e) => {
  if (viewMode === 'cards') return;
  e.preventDefault();
  // ...existing logic
};
```

Add `viewMode` to that effect’s dependency array.

- [ ] **Step 3: Document shortcuts**

In `KeyboardShortcuts.jsx`, add to the `shortcuts` array (near navigation entries):

```js
{ key: 'C', desc: 'Toggle Focus cards / Show map' },
{ key: 'Esc', desc: 'Exit Focus cards (back to map)' },
```

- [ ] **Step 4: Manual check**

- `C` toggles map ↔ cards; with Search focused, `C` types into the input (handler returns early).
- In cards mode, `Esc` returns to map.
- Open `?` help, press `Esc` once → help closes, still in cards; second `Esc` → map.
- In cards mode, wheel over a long event/interlude scrolls the card; does not change events. Arrow keys still change events.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/ExploreView.jsx client/src/components/KeyboardShortcuts.jsx
git commit -m "$(cat <<'EOF'
feat: wire C/Esc for cards focus and stop wheel hijack while reading

Let keyboard toggle focus mode safely alongside the shortcuts panel, and allow card scrolling in cards mode.
EOF
)"
```

---

### Task 5: Mobile bottom sheet lock in cards mode

**Files:**
- Modify: `client/src/components/MobileBottomSheet.jsx`
- Modify: `client/src/components/ExploreView.jsx` (pass `locked`)
- Modify: `client/src/App.css` (optional mobile cards-mode tweaks if sheet needs full bleed)

**Interfaces:**
- Consumes: `viewMode` from ExploreView
- Produces: `MobileBottomSheet` prop `locked: boolean` — when true: snap forced to `full`, no peek-on-event-change, handle cannot collapse to peek, drag constrained to full

- [ ] **Step 1: Add `locked` prop to MobileBottomSheet**

```jsx
export default function MobileBottomSheet({
  children,
  controlsContent,
  panelContent,
  eventId,
  darkMode,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  locked = false,
}) {
```

Force full while locked (after existing state declarations):

```js
useEffect(() => {
  if (locked && snapName !== 'full') setSnapName('full');
}, [locked, snapName]);
```

Change the event-change peek reset to no-op when locked:

```js
const [lastEventId, setLastEventId] = useState(eventId);
if (eventId !== lastEventId) {
  setLastEventId(eventId);
  if (!locked) setSnapName('peek');
}
```

Handle click: if locked, do not toggle to peek (Focus button is the exit):

```jsx
onClick={() => {
  if (locked) return;
  snapTo(snapName === 'peek' ? 'full' : 'peek');
}}
```

Drag: when locked, disable sheet drag (handle still present for affordance, or keep drag but constraints pin to full):

```jsx
drag={locked ? false : 'y'}
dragConstraints={
  locked
    ? { top: snaps.full, bottom: snaps.full }
    : { top: snaps.full, bottom: snaps.peek }
}
```

- [ ] **Step 2: Pass `locked` from ExploreView**

```jsx
<MobileBottomSheet
  eventId={currentItem?.key}
  darkMode={darkMode}
  controlsContent={controlsContent}
  locked={viewMode === 'cards'}
  /* ... */
>
```

- [ ] **Step 3: Manual check (mobile width ≤768 or device)**

- Map mode: peek/full and swipe-to-navigate still work as today.
- Focus cards: map hidden, sheet full, advancing events does **not** collapse to peek.
- Handle drag/click does not collapse while locked; Show map (or `C` on desktop keyboard) restores map + normal sheet behavior.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/MobileBottomSheet.jsx client/src/components/ExploreView.jsx client/src/App.css
git commit -m "$(cat <<'EOF'
feat: lock mobile sheet full-height in cards focus mode

Keep the bottom sheet expanded while reading cards-only so event changes do not snap back to peek.
EOF
)"
```

---

### Task 6: End-to-end verification + lint

**Files:**
- None required unless fixes surface

**Interfaces:**
- Consumes: Tasks 1–5 complete feature
- Produces: confirmed success criteria from the spec

- [ ] **Step 1: Lint + build**

Run:

```bash
cd client && npm run lint && npm run build
```

Expected: both succeed (fix any issues introduced by this work before proceeding).

- [ ] **Step 2: Spec success-criteria checklist**

Desktop:

- [ ] Default card ~48vh with map visible
- [ ] Focus cards hides map completely; Show map restores it sized correctly
- [ ] `C` / `Esc` work; help panel wins first `Esc`
- [ ] Cards mode: wheel scrolls content; arrows/play still navigate
- [ ] Filters in cards: no colony/legend; type filters OK
- [ ] Interlude in both modes looks usable

Mobile:

- [ ] Same Focus/Show map control in sheet controls
- [ ] Cards mode: full sheet, no peek on event change
- [ ] Map mode sheet behavior unchanged

- [ ] **Step 3: Commit any verification fixes** (only if needed)

```bash
git add -u
git commit -m "$(cat <<'EOF'
fix: polish cards focus mode after end-to-end checks

EOF
)"
```

If nothing to fix, skip this commit.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Desktop ~48vh / interlude taller / landscape override | 1 |
| `coveredRatio` aligned with taller card | 1 |
| `viewMode` + root class | 2 |
| Hide map without unmount + `invalidateSize` | 2 |
| Full-viewport desktop card in cards mode | 2 |
| Focus button in shared `controlsContent` | 3 |
| Hide colony + map legend in cards | 3 |
| `C` / `Esc` + shortcuts docs | 4 |
| Wheel gate in cards mode | 4 |
| Mobile sheet locked full / no peek-on-event | 5 |
| Stay in cards across event/play/resize | 2–5 (state never auto-resets) |
| Session-only, no URL persistence | 2 (React state only) |
| End-of-timeline overlay still works | unchanged; verified in 6 |
