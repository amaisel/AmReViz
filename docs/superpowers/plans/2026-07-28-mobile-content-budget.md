# Mobile Content Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the map and the opening paragraph of the story on a mobile screen at the same time, in the default state.

**Architecture:** Three edits to the existing bottom-sheet layout, no structural change. The always-visible control row collapses into one disclosure button; the hero image yields its space in the peek state only; the mobile map drops to seaboard zoom 5. A shared constant replaces two literals that had to agree.

**Tech Stack:** React 19, Vite 7, Leaflet / react-leaflet, framer-motion, Playwright.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-mobile-content-budget-design.md`
- Scope is route 1 only. Do not replace the bottom sheet with a sticky map.
- All work on branch `mobile-content-budget`. `main` is protected; CODEOWNERS covers every path.
- Working directory for all commands is `client/`.
- `npm run lint` and `npm run build` must be clean before every commit.
- There is no `npm test`. Run Playwright as `npx playwright test`; it boots its own server on port 5174.
- Mobile breakpoint is `max-width: 768px` throughout. Do not introduce a second one.
- Reference viewports: 390×844 (primary) and 375×667 (small). Both must pass.
- Worst-case event for layout is **id 9, "Battle of Long Island"** — hero image plus a 333-character description. Do not substitute event 1; it is not the binding case.
- Do not add test-only attributes to production markup. Assert on what a user can see.

---

### Task 1: Share the peek ratio, and drop the mobile map to zoom 5

`Map.jsx:859` hardcodes `coveredRatio = 0.55` to mirror `SNAP_PEEK_RATIO = 0.55`
in `MobileBottomSheet.jsx`. Two literals that must agree or the map centres the
active marker wrong. Same task also gives the mobile map its own seaboard zoom.

**Files:**
- Create: `client/src/constants/layout.js`
- Modify: `client/src/components/MobileBottomSheet.jsx:4` (and `getSnapPoints`)
- Modify: `client/src/components/Map.jsx:795` and `:851-859` and `:934`
- Test: `client/tests/ux-audit.spec.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `MOBILE_SHEET_PEEK_RATIO: number` exported from
  `client/src/constants/layout.js`. Later tasks do not depend on it.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block in `client/tests/ux-audit.spec.js`:

```js
  test('the mobile map opens on a theatre, not two colonies', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet')).toBeVisible();

    // Two fixed geographic points. Their on-screen separation halves for every
    // zoom level, so it reads the map's scale directly rather than counting
    // labels, whose placement shifts. Measured: ~276px at zoom 6, ~138px at 5.
    const labelGap = () =>
      page.evaluate(() => {
        const pick = (t) =>
          [...document.querySelectorAll('.leaflet-marker-icon')].find(
            (el) => (el.textContent || '').trim() === t,
          );
        const a = pick('MA');
        const b = pick('PA');
        if (!a || !b) return null;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return Math.hypot(ra.left - rb.left, ra.top - rb.top);
      });

    await expect.poll(labelGap, { timeout: 10_000 }).toBeLessThan(200);
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx playwright test -g "opens on a theatre"`
Expected: FAIL — the gap polls at roughly 276, not under 200.

- [ ] **Step 3: Create the shared constant**

Create `client/src/constants/layout.js`:

```js
// The mobile bottom sheet covers this fraction of the viewport at its peek
// snap. Two places have to agree on it: the sheet, which snaps there, and the
// map, which lifts the active marker clear of it. They lived as independent
// literals in two files until this constant existed — tuning one silently
// broke the other's centring.
export const MOBILE_SHEET_PEEK_RATIO = 0.55;
```

- [ ] **Step 4: Point the sheet at it**

In `client/src/components/MobileBottomSheet.jsx`, add to the imports:

```js
import { MOBILE_SHEET_PEEK_RATIO } from '../constants/layout';
```

Delete the `SNAP_PEEK_RATIO` const and use the import in `getSnapPoints`:

```js
function getSnapPoints(vh) {
  return {
    peek: vh * (1 - MOBILE_SHEET_PEEK_RATIO),
    full: vh * (1 - SNAP_FULL_RATIO),
  };
}
```

- [ ] **Step 5: Point the map at it, and add the mobile zoom**

In `client/src/components/Map.jsx`, add to the imports:

```js
import { MOBILE_SHEET_PEEK_RATIO } from '../constants/layout';
```

Beside `const SEABOARD_ZOOM = 6;` add:

```js
// A 390x332 strip at the desktop zoom of 6 is about two and a half colonies.
// Zoom 5 — already the seaboard minZoom, so no floor change — carries Quebec
// to Pennsylvania.
const SEABOARD_MOBILE_ZOOM = 5;
```

Replace the `zoom` assignment:

```js
  const zoom = isOverseas
    ? (isMobile ? OVERSEAS_MOBILE_ZOOM : ATLANTIC_MIN_ZOOM)
    : (isMobile ? SEABOARD_MOBILE_ZOOM : SEABOARD_ZOOM);
```

Replace the `coveredRatio` line:

```js
  // The mobile bottom sheet covers part of the map; desktop uses a side rail.
  const coveredRatio = isMobile ? MOBILE_SHEET_PEEK_RATIO : 0;
```

At the `<MapContainer>` (around line 934) the initial `zoom={SEABOARD_ZOOM}`
must match, or the map paints one frame at zoom 6 before the controller
corrects it:

```jsx
        zoom={isMobile ? SEABOARD_MOBILE_ZOOM : SEABOARD_ZOOM}
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `npx playwright test -g "opens on a theatre"`
Expected: PASS

- [ ] **Step 7: Run the whole suite, lint and build**

Run: `npx playwright test && npm run lint && npm run build`
Expected: all pass. If `the overseas frame keeps its target on screen on a phone`
fails, the overseas branch was changed by mistake — it must still use
`OVERSEAS_MOBILE_ZOOM`.

- [ ] **Step 8: Commit**

```bash
git add src/constants/layout.js src/components/MobileBottomSheet.jsx src/components/Map.jsx tests/ux-audit.spec.js
git commit -m "Give the mobile map its own seaboard zoom

At zoom 6 a 390x332 strip is about two and a half colonies. Zoom 5 is
already the seaboard minZoom, so this costs no floor change and carries
Quebec to Pennsylvania.

Also replaces the two independent 0.55 literals - the sheet's peek snap
and the map's covered ratio - with one shared constant. They had to
agree, and nothing said so."
```

---

### Task 2: Drop the hero image in the peek state

The hero costs 147–153px. On a 375×667 the whole content budget at peek is
307px. It returns the moment the sheet expands.

**Files:**
- Modify: `client/src/components/MobileBottomSheet.jsx:237-250`
- Modify: `client/src/App.css` (after the `.bottom-sheet-content .event-card-fixed` block, around line 3110)
- Test: `client/tests/ux-audit.spec.js`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: CSS class `peek` / `expanded` on `.bottom-sheet-content`. Task 3
  does not touch it.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block:

```js
  test('the hero image yields its space at peek and returns on expand', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Event 9 carries a hero image; most events do not.
    await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();

    const hero = page.locator('.bottom-sheet-content .event-card-image');
    await expect(hero).toBeHidden();

    await page.getByRole('button', { name: 'Expand event details' }).click();
    await expect(hero).toBeVisible();
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx playwright test -g "hero image yields"`
Expected: FAIL — the hero is visible at peek.

- [ ] **Step 3: Mark the snap state on the content container**

In `client/src/components/MobileBottomSheet.jsx`, change the content div's
className so the current snap is expressed in the DOM:

```jsx
      <div
        className={`bottom-sheet-content ${isFullOpen ? 'expanded' : 'peek'}`}
        ref={contentRef}
```

Leave the rest of that element's props unchanged.

- [ ] **Step 4: Hide the hero at peek**

In `client/src/App.css`, after the `.bottom-sheet-content .event-card-fixed`
rule block, add:

```css
/* At peek the sheet has ~404px of content budget on a 390x844 and ~307px on a
   375x667. The hero costs 147-153px of that, which is the difference between
   the opening paragraph clearing the fold and sitting below it. The painting
   is one drag away, and it leads the expanded view. */
.bottom-sheet-content.peek .event-card-image {
  display: none;
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `npx playwright test -g "hero image yields"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/MobileBottomSheet.jsx src/App.css tests/ux-audit.spec.js
git commit -m "Give the peek sheet its hero image's space back

147-153px of a 307px budget on a 375x667. Hidden at peek only; the
painting returns on expand, where it still leads the card."
```

---

### Task 3: Collapse the control row into one disclosure button

The always-visible Play / speed / Filter / Search / Focus-cards row is 154px
and wraps to three lines on a 390px viewport. With the 60px handle it is 214px
of a 464px sheet. It becomes one button in the handle row.

The current two-level structure — a Filter button inside the control row that
opens a filters panel — flattens. The panel *is* the disclosure, so the filter
chips go straight into it.

**Files:**
- Modify: `client/src/components/MobileBottomSheet.jsx` (imports, new state, header markup, panel render, props)
- Modify: `client/src/components/ExploreView.jsx:497-569` (split `controlsContent`), `:659-687` (sheet props)
- Modify: `client/src/App.css` (`.bottom-sheet-handle` width, new header and panel rules)
- Test: `client/tests/ux-audit.spec.js` — one new assertion, two existing tests updated

**Interfaces:**
- Consumes: `.bottom-sheet-content.peek` from Task 2 (untouched here).
- Produces: `MobileBottomSheet` prop signature changes — `controlsContent` and
  `panelContent` are replaced by a single `panelContent`. Task 4 edits the same
  component and must not reintroduce them.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block:

```js
  test('story controls sit behind one button, not across the peek sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.bottom-sheet')).toBeVisible();

    // Chrome above the card. It was 214px of a 464px sheet: a 60px handle plus
    // a 154px control row that wrapped to three lines.
    const chrome = await page.evaluate(() => {
      const sheet = document.querySelector('.bottom-sheet');
      const content = document.querySelector('.bottom-sheet-content');
      return content.getBoundingClientRect().top - sheet.getBoundingClientRect().top;
    });
    expect(chrome).toBeLessThan(80);

    // Everything that left the row is still reachable, one tap away.
    const toggle = page.getByRole('button', { name: 'Story controls' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Search historical events' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Battles' })).toBeVisible();
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx playwright test -g "behind one button"`
Expected: FAIL — chrome measures ~214, and no "Story controls" button exists.

- [ ] **Step 3: Split ExploreView's controls into reusable pieces**

In `client/src/components/ExploreView.jsx`, replace the single
`const controlsContent = (...)` block with named pieces plus two assemblies.
The desktop assembly is unchanged in content; the mobile one omits the Filter
toggle (its chips are in the panel already) and the view-mode button (Task 4).

```jsx
  const playbackButton = (
    <button
      className={`explore-btn playback-btn ${isPlaying ? 'active' : ''}`}
      onClick={togglePlayback}
    >
      {isPlaying ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Pause
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Play
        </>
      )}
    </button>
  );

  const speedButton = (
    <button className="speed-indicator" onClick={cycleSpeed}>
      {speedLabel}
    </button>
  );

  const searchField = (
    <SearchBar
      events={events}
      onEventSelect={handleSearchSelect}
      darkMode={darkMode}
    />
  );

  const filterToggleButton = (
    <button
      className={`explore-btn filter-toggle-btn ${filtersOpen ? 'active' : ''}`}
      onClick={() => setFiltersOpen(prev => !prev)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
      Filter
      {activeFilterCount < 4 && (
        <span className="filter-count-badge">{activeFilterCount}</span>
      )}
    </button>
  );

  const viewModeButton = (
    <button
      type="button"
      className={`explore-btn view-mode-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
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
  );

  // Desktop rail: unchanged in content from the single row it replaces.
  const controlsContent = (
    <>
      {playbackButton}
      {speedButton}
      <span className="controls-divider" />
      {filterToggleButton}
      {searchField}
      <span className="controls-divider" />
      {viewModeButton}
    </>
  );

  // Mobile: one flat panel behind the sheet's control button. No Filter
  // toggle — the panel is already the disclosure, so the chips sit in it
  // directly rather than behind a second one.
  const sheetPanelContent = (
    <>
      <div className="sheet-panel-playback">
        {playbackButton}
        {speedButton}
      </div>
      {searchField}
      {filtersPanelContent}
    </>
  );
```

Note `filtersPanelContent` is already defined above this point in the file —
leave it where it is.

- [ ] **Step 4: Give the sheet a header row and a disclosure panel**

In `client/src/components/MobileBottomSheet.jsx`, extend the framer-motion
import to include `AnimatePresence`:

```js
import { motion as Motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';
```

Change the component signature — `controlsContent` is gone, `panelContent`
stays but now carries everything:

```jsx
export default function MobileBottomSheet({
  children,
  panelContent,
  eventId,
  darkMode,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  locked = false,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
```

Close the panel when the story moves, so it does not shadow the next card.
Extend the existing event-change block:

```jsx
  const [lastEventId, setLastEventId] = useState(eventId);
  if (eventId !== lastEventId) {
    setLastEventId(eventId);
    setPanelOpen(false);
    if (!locked) setSnapName('peek');
  }
```

Replace the standalone handle `<button>` and the `.bottom-sheet-controls` div
with a header row carrying both:

```jsx
      <div className="bottom-sheet-header">
        <button
          type="button"
          className="bottom-sheet-handle"
          onPointerDown={(e) => {
            if (locked) return;
            dragControls.start(e);
          }}
          onClick={() => {
            if (locked) return;
            snapTo(snapName === 'peek' ? 'full' : 'peek');
          }}
          aria-label={locked ? 'Cards focus mode' : (isFullOpen ? 'Collapse event details' : 'Expand event details')}
          aria-expanded={locked ? undefined : isFullOpen}
          disabled={locked}
        >
          <span className={`bottom-sheet-chevron ${snapName !== 'peek' ? 'flipped' : ''}`}>
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 10 8 6 12 10"/>
            </svg>
          </span>
          <div className="bottom-sheet-bar" style={{ width: '40px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', marginTop: '-4px' }} />
        </button>

        <button
          type="button"
          className={`sheet-panel-toggle ${panelOpen ? 'active' : ''}`}
          onClick={() => setPanelOpen(prev => !prev)}
          aria-expanded={panelOpen}
          aria-label="Story controls"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="4" y1="9" x2="20" y2="9"/>
            <line x1="4" y1="16" x2="20" y2="16"/>
            <circle cx="9" cy="9" r="2.2" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="16" r="2.2" fill="currentColor" stroke="none"/>
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <Motion.div
            className="sheet-controls-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {panelContent}
          </Motion.div>
        )}
      </AnimatePresence>
```

The old `{panelContent}` line that sat below `.bottom-sheet-controls` is now
inside this block — do not leave a second copy.

- [ ] **Step 5: Update the sheet's call site**

In `client/src/components/ExploreView.jsx`, replace the `<MobileBottomSheet>`
element's props. The `AnimatePresence`-wrapped filters panel it used to pass is
gone; `sheetPanelContent` supersedes it.

```jsx
      {isMobile && (
        <MobileBottomSheet
          eventId={currentItem?.key}
          darkMode={darkMode}
          locked={viewMode === 'cards'}
          onPrev={handlePrevEvent}
          onNext={handleNextEvent}
          hasPrev={hasPrev}
          hasNext={hasNext}
          panelContent={sheetPanelContent}
        >
          {cardContent}
        </MobileBottomSheet>
      )}
```

- [ ] **Step 6: Style the header row and panel**

In `client/src/App.css`, change `.bottom-sheet-handle`'s `width: 100%;` to
`flex: 1;` so it shares the row. Then replace the `.bottom-sheet-controls` and
`.bottom-sheet.dark .bottom-sheet-controls` rules with:

```css
.bottom-sheet-header {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Absolute, so the handle stays optically centred in the row regardless of
   this button's width, and so a press here never starts the sheet drag. */
.sheet-panel-toggle {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: none;
  color: rgba(0, 0, 0, 0.55);
  cursor: pointer;
}

.sheet-panel-toggle.active {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.85);
}

.bottom-sheet.dark .sheet-panel-toggle {
  color: rgba(255, 255, 255, 0.6);
}

.bottom-sheet.dark .sheet-panel-toggle.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.sheet-controls-panel {
  flex-shrink: 0;
  padding: 0.25rem 1rem 0.7rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.bottom-sheet.dark .sheet-controls-panel {
  border-bottom-color: rgba(255, 255, 255, 0.06);
}

.sheet-panel-playback {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
```

- [ ] **Step 7: Update the two existing mobile tests**

In `mobile explore view is accessible and the sheet handle is keyboard reachable`,
the search field now lives in the closed panel, so its count is 0 until the
panel opens. Replace the final two assertions with:

```js
    // Only one copy of the card exists on mobile.
    await expect(page.locator('.event-card-fixed')).toHaveCount(1);

    // Search moved into the controls panel; one copy, once it is open.
    await page.getByRole('button', { name: 'Story controls' }).click();
    await expect(page.getByRole('combobox', { name: 'Search historical events' })).toHaveCount(1);
```

Note this test presses Enter on the handle earlier, leaving the sheet expanded —
the panel toggle is in the header and reachable in both snap states, so the
order above works as written.

`mobile explore view uses a bounded, expandable bottom sheet` needs no change;
it asserts on the handle and layout overflow, neither of which moved. Run it to
confirm rather than assuming.

- [ ] **Step 8: Run the new test, then the whole suite**

Run: `npx playwright test -g "behind one button"`
Expected: PASS

Run: `npx playwright test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/components/MobileBottomSheet.jsx src/components/ExploreView.jsx src/App.css tests/ux-audit.spec.js
git commit -m "Collapse the sheet's control row into one button

The row was 154px and wrapped to three lines at 390px wide; with the
handle it took 214px of a 464px sheet before any content. It is now a
single disclosure button in the handle row, chrome under 80px.

The Filter button goes with it: the panel is already a disclosure, so
the chips sit in it directly instead of behind a second one."
```

---

### Task 4: Remove cards focus on mobile

It locks the sheet to full and hides the map — the state this work exists to
get away from. Removing it also deletes the `locked` branches from the sheet.

**Files:**
- Modify: `client/src/components/MobileBottomSheet.jsx` (remove `locked` throughout)
- Modify: `client/src/components/ExploreView.jsx:209-214` (media query listener), `:318-322` (the `c` shortcut), sheet props
- Test: `client/tests/ux-audit.spec.js`

**Interfaces:**
- Consumes: the `MobileBottomSheet` signature from Task 3.
- Produces: `MobileBottomSheet` no longer accepts `locked`.

- [ ] **Step 1: Write the failing test**

Append inside the `test.describe` block:

```js
  test('cards focus is desktop-only and a resize to mobile restores the map', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${baseUrl}#/explore/1`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Focus cards' }).click();
    await expect(page.locator('.scrollytelling-view.view-mode-cards')).toBeVisible();

    // Narrowing must not strand the map hidden with no control to bring it back.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('.scrollytelling-view.view-mode-map')).toBeVisible();
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Focus cards' })).toHaveCount(0);
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx playwright test -g "cards focus is desktop-only"`
Expected: FAIL — the view stays in `view-mode-cards` after the resize.

- [ ] **Step 3: Reset the view mode when the layout becomes mobile**

In `client/src/components/ExploreView.jsx`, replace the media-query effect:

```jsx
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => {
      setIsMobile(e.matches);
      // Cards focus is desktop-only. Without this, narrowing the window while
      // it is active leaves the map hidden and removes the only control that
      // could bring it back.
      if (e.matches) setViewMode('map');
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
```

- [ ] **Step 4: Stop the `c` shortcut toggling it on mobile**

In the keyboard effect, guard the toggle and the Escape branch:

```jsx
      if ((e.key === 'c' || e.key === 'C') && !isMobile) {
        e.preventDefault();
        toggleViewMode();
        return;
      }
```

Add `isMobile` to that effect's dependency array, which currently reads
`[storyItems.length, togglePlayback, viewMode, toggleViewMode]`:

```jsx
  }, [storyItems.length, togglePlayback, viewMode, toggleViewMode, isMobile]);
```

- [ ] **Step 5: Drop the `locked` prop at the call site**

In the `<MobileBottomSheet>` element, delete the line:

```jsx
          locked={viewMode === 'cards'}
```

- [ ] **Step 6: Delete `locked` from the sheet**

In `client/src/components/MobileBottomSheet.jsx`:

Remove `locked = false,` from the props. Then:

- In the bounce effect, delete the leading `if (locked) return;` and drop
  `locked` from its dependency array, leaving `[sheetControls, snaps.peek]`.
- Delete the whole block:
  ```jsx
  if (locked && snapName !== 'full') {
    setSnapName('full');
  }
  ```
  and the comment above it.
- In the event-change block, `if (!locked) setSnapName('peek');` becomes
  `setSnapName('peek');`.
- On the `Motion.div`, replace the four locked-aware props:
  ```jsx
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: snaps.full, bottom: snaps.peek }}
      dragElastic={{ top: 0.2, bottom: 0.2 }}
  ```
- On the handle button, drop the guards and the ternaries:
  ```jsx
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => snapTo(snapName === 'peek' ? 'full' : 'peek')}
          aria-label={isFullOpen ? 'Collapse event details' : 'Expand event details'}
          aria-expanded={isFullOpen}
  ```
  and delete the `disabled={locked}` attribute.

- [ ] **Step 7: Confirm nothing still references it**

Run: `grep -rn "locked" src/components/MobileBottomSheet.jsx src/components/ExploreView.jsx`
Expected: no output.

Also remove the now-dead `.bottom-sheet-handle:disabled` rule from
`client/src/App.css` — nothing can disable that button any more.

- [ ] **Step 8: Run the test, then the whole suite**

Run: `npx playwright test -g "cards focus is desktop-only"`
Expected: PASS

Run: `npx playwright test && npm run lint && npm run build`
Expected: all pass. `explore view is accessible in both map and cards focus
mode` runs at desktop size and must still pass — cards focus is unchanged there.

- [ ] **Step 9: Commit**

```bash
git add src/components/MobileBottomSheet.jsx src/components/ExploreView.jsx src/App.css tests/ux-audit.spec.js
git commit -m "Drop cards focus on mobile

It locked the sheet to full and hid the map, which is the state this
work exists to get away from; expanding the sheet already gives a
full-bleed read. Desktop keeps it, where it hides a map that is not
competing for space.

Removing it deletes the locked branches from the sheet: forced snap,
drag disable, disabled handle, and the aria swap. A desktop-to-mobile
resize now resets the view mode rather than stranding the map hidden."
```

---

### Task 5: Assert the outcome the whole change exists for

Everything above is a means. This is the end: map and opening paragraph on
screen together, in the default state, on both reference viewports.

**Files:**
- Test: `client/tests/ux-audit.spec.js`

**Interfaces:**
- Consumes: all of Tasks 1–4. This task adds no production code.
- Produces: nothing.

- [ ] **Step 1: Write the acceptance tests**

Append inside the `test.describe` block:

```js
  // The point of the mobile layout work: place and narrative on screen at the
  // same time, in the default state, without the reader toggling anything.
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
  ]) {
    test(`the map and the opening paragraph share a ${viewport.width}x${viewport.height} screen`, async ({ page }) => {
      await page.setViewportSize(viewport);
      // Event 9 is the binding case in the set: one of the 18 events that can
      // carry a hero image, and the longest description among them at 333
      // characters. Event 1 fits comfortably and proves nothing.
      await page.goto(`${baseUrl}#/explore/9`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: 'Battle of Long Island' })).toBeVisible();
      await settleCardAnimation(page, '.bottom-sheet');

      const layout = await page.evaluate(() => {
        const sheet = document.querySelector('.bottom-sheet');
        const prose = [...document.querySelectorAll('.bottom-sheet-content p')]
          .filter((p) => p.textContent.trim().length > 60)[0];
        return {
          viewportHeight: window.innerHeight,
          mapStripHeight: sheet.getBoundingClientRect().top,
          proseBottom: prose ? prose.getBoundingClientRect().bottom : null,
        };
      });

      expect(layout.proseBottom).not.toBeNull();
      // Fully above the fold, not merely started.
      expect(layout.proseBottom).toBeLessThanOrEqual(layout.viewportHeight);
      // And the map is still a map, not a sliver.
      expect(layout.mapStripHeight / layout.viewportHeight).toBeGreaterThanOrEqual(0.4);
    });
  }

  test('a data interlude leads with its argument at peek', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}#/explore/5`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Battle of Bunker Hill' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('heading', { name: 'The Cost of Rebellion' })).toBeVisible();
    await settleCardAnimation(page, '.bottom-sheet');

    // The standfirst, deliberately not the chart. The chart clears a 390x844
    // by 4px but overflows a 375x667 by 94px, so asserting on it would be
    // wrong rather than merely flaky.
    const proseBottom = await page.evaluate(() => {
      const prose = [...document.querySelectorAll('.bottom-sheet-content p')]
        .filter((p) => p.textContent.trim().length > 60)[0];
      return prose ? prose.getBoundingClientRect().bottom : null;
    });

    expect(proseBottom).not.toBeNull();
    expect(proseBottom).toBeLessThanOrEqual(667);
  });
```

- [ ] **Step 2: Run them**

Run: `npx playwright test -g "share a|leads with its argument"`
Expected: PASS on all three. These are written after the implementation
deliberately — they assert the composite outcome, and no single earlier task
could make them pass alone.

If the 375×667 case fails, do not relax the assertion. Re-measure with the
running app and find which of the three edits did not land.

- [ ] **Step 3: Run the whole suite, lint and build**

Run: `npx playwright test && npm run lint && npm run build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add tests/ux-audit.spec.js
git commit -m "Assert map and opening paragraph share the screen

Both reference viewports, on the binding case: event 9 carries a hero
image and the longest description among the events that can. Also
covers the interlude card, on its standfirst rather than its chart -
the chart clears a 390x844 by 4px but overflows a 375x667 by 94px."
```

---

### Task 6: Record the outcome in ROADMAP

Item 1 currently describes the defect and proposes two routes. It should
describe what was done and what the measurements now say, so the next reader
sees the result rather than the original complaint.

**Files:**
- Modify: `ROADMAP.md:35-72` (repo root, not `client/`)

**Interfaces:**
- Consumes: the measured results from Task 5.
- Produces: nothing.

- [ ] **Step 1: Replace the item 1 body**

Replace everything from `### 1. Mobile shows place and narrative alternately, never together` up to (not including) `### 2. Four of the eight type-badge colours fail WCAG contrast` with:

```markdown
### 1. Mobile map and narrative — fixed, route 2 still open

Resolved 2026-07-28. Mobile was structurally modal: the peek sheet spent 46%
of its 464px on chrome (60px handle plus a 154px control row that wrapped to
three lines), then 153px on a hero image, leaving the first prose line 49px
below the fold.

Three edits reclaimed the budget. The control row became one disclosure button
in the handle row, taking chrome under 80px. The hero image now yields its
space in the peek state and returns on expand. The mobile map dropped to
seaboard zoom 5 — already the `minZoom`, so no floor change — which widens the
strip from about two and a half colonies to Quebec–Pennsylvania.

Measured on the binding case (event 9, the longest description among the 18
events that can carry a hero image), distance of the opening paragraph from
the fold, negative meaning clear:

| | 390×844 | 375×667 |
|---|---|---|
| before | +10 | +101 |
| after | **−153** | **−55** |

The map holds 45% of the viewport in both. Worth noting for anyone revisiting
this: removing the controls *alone* failed on both sizes. Both edits were
needed.

Cards focus was dropped on mobile in the same change — it locked the sheet to
full and hid the map — which deleted the `locked` branches from
`MobileBottomSheet`. It remains on desktop.

**Still open: replacing the sheet with a sticky map.** The standard mobile
scrollytelling shape — a map strip pinned at roughly 30vh, article scrolling
under it, the map re-aiming as each event comes into view. This was the second
of the two routes and its main justification was the co-presence defect above,
which is now fixed; what remains is a preference for scroll-driven reading
rather than a bug. It would delete `MobileBottomSheet` and its snap/gesture
logic including the horizontal swipe. A redesign, not an afternoon.

What not to do: fall back to static map images on mobile. The map is the piece.
```

- [ ] **Step 2: Commit**

```bash
cd .. && git add ROADMAP.md && git commit -m "Record the mobile layout outcome in ROADMAP

Item 1 described the defect and two candidate routes. Route 1 shipped,
so it now carries the measurements instead, including the finding that
removing the controls alone was not sufficient on either viewport.

Route 2 stays, restated as an open preference rather than a fix for a
defect that no longer exists."
```

---

## Self-review

**Spec coverage.** Controls out of the peek row → Task 3. Hero dropped at peek
→ Task 2. Mobile seaboard zoom 5 → Task 1. Shared peek-ratio constant → Task 1.
Focus cards dropped on mobile plus the `viewMode` reset → Task 4. New
acceptance test at both viewports on event 9 → Task 5. Interlude on its
standfirst → Task 5. Both existing mobile tests updated → Task 3 Step 7.
ROADMAP follow-up → Task 6. No gaps.

**Type consistency.** `MOBILE_SHEET_PEEK_RATIO` is defined in Task 1 and used
in the same task only. `panelContent` is the sheet's single panel prop from
Task 3 onward; `controlsContent` is removed there and never reappears. `locked`
survives Task 3 unchanged and is removed in Task 4 — Task 3's markup still
carries its guards deliberately, so the two tasks do not conflict. The
`.peek` / `.expanded` class from Task 2 is untouched by later tasks.

**Ordering note.** Task 5's assertions cannot pass until Tasks 1–4 all land,
which is why they are a separate task rather than folded into Task 2 or 3. Each
of Tasks 1–4 carries its own independently passing test.
