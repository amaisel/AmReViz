# Cards Focus Mode — Design Spec

**Date:** 2026-07-08  
**Status:** Approved for planning  
**Scope:** Explore view layout — taller default desktop card + cross-platform cards-only focus mode

## Problem

The desktop bottom event card is capped around `35vh` (`max(35vh, 300px)`), which feels cramped relative to the screen and offers no way to read the narrative without the map competing for attention. Mobile already has peek/full sheet snaps (~55% / ~90%), but there is no shared “focus on cards” experience across platforms.

## Goals

1. Size the default (map-visible) desktop card more generously relative to the viewport.
2. Let the user focus entirely on event/interlude cards via an explicit control.
3. Same mental model on desktop and mobile: **map + card** vs **cards only**.

## Non-goals

- URL- or localStorage-persisted view mode
- Drag-to-expand on desktop
- Three-size snap ladder (compact / comfortable / full)
- Redesigning card content typography or interlude charts beyond layout headroom
- Changing map camera / fit logic beyond whatever `invalidateSize` needs after unhiding

## Approaches considered

1. **Shared `viewMode` toggle (chosen)** — `map` | `cards` in `ExploreView`; hide map in cards mode; taller default card in map mode.
2. Desktop-only expand — smaller change, breaks cross-platform consistency.
3. Unified bottom sheet on both platforms — heavier refactor; desktop drag is awkward.

## Design

### Modes

Owned by `ExploreView` as React state:

```text
viewMode: 'map' | 'cards'   // default: 'map'
```

Root explore container gets a class such as `view-mode-map` / `view-mode-cards` so CSS can drive layout without duplicating trees.

| Mode | Map | Card pane |
|------|-----|-----------|
| `map` (default) | Full-bleed behind UI | **Desktop:** `max-height: max(48vh, 320px)` (interludes: `max(56vh, 360px)`). Update the landscape short-viewport override to match (today it hardcodes `35vh`). **Mobile:** existing peek/full snaps unchanged |
| `cards` | Fully hidden via CSS (`visibility`/`display` + `aria-hidden`), **do not unmount** — preserve Leaflet camera/state. After returning to `map`, call Leaflet `invalidateSize` (or equivalent) so the map fills correctly | **Desktop:** card becomes a full-viewport reading panel (edge to edge under the status chip; content scrolls inside). **Mobile:** sheet locked to full height — no peek, no handle-drag collapse, and the existing “collapse to peek on event change” behavior is suppressed while in `cards` |

Switching modes does **not** change `currentIndex` / event. Prev/next, play, filters, search, and year chip continue to work.

### Explicit control

**Placement:** one toggle inside the shared `controlsContent` (Play / Speed / Filter / Search row). That row already renders on desktop (`desktop-controls`) and inside the mobile sheet, so both platforms get the same control without forking `EventCard`.

- Style like existing `explore-btn`.
- Labels: **“Focus cards”** in `map` mode; **“Show map”** in `cards` mode. Icon + text by default; icon-only with `aria-label` under the existing narrow/landscape rules that already hide control labels is fine.
- Active/pressed styling when `viewMode === 'cards'` (same pattern as Play/Filter active states).

**Keyboard** (in `ExploreView`’s existing keydown handler, with the same input/textarea/select guard):

- `C` toggles `map` ↔ `cards`.
- `Escape` exits `cards` → `map` only when already in `cards` and the shortcuts help panel is not open (help panel keeps first claim on `Escape`).
- Document both in `KeyboardShortcuts`.

### Chrome in `cards` mode

**Keep visible**

- Year / progress status chip
- Shared controls row (Play, speed, Filter, Search, Focus/Show map)
- Prev / next on the card
- Event / interlude card content (full viewport)
- End-of-timeline overlay (Replay / Start Over) if the user reaches the end

**Hide or suppress**

- Map container (CSS-hidden, not unmounted) and map-only overlays
- Inside the filters panel: **Color colonies** checkbox and **Map Legend** block (map-only). Keep event-type filters and presets.
- Mobile sheet drag-to-collapse and peek snap while locked in `cards`

Onboarding hint: leave as-is for v1 (no new copy required).

### Interaction conflicts

| Input | `map` mode | `cards` mode |
|-------|------------|--------------|
| Wheel on explore view | Existing event navigation (`preventDefault` + index change) | **Do not steal wheel** from the scrolling card. Disable the explore-level wheel→event handler while in `cards` (arrow keys / buttons / play still navigate) |
| Mobile body swipe (up/down = next/prev) | Unchanged at peek; at full, content scrolls | Sheet is full-locked; content scrolls; keep swipe-to-navigate **off** while full (same as today’s `isFullOpen` behavior) |
| Map marker click | Jump to event | N/A (map hidden); search / prev-next / play still work |

### Desktop layout details (`map` mode)

Today `.desktop-event-card` sits at `bottom: 50px` with controls also bottom-anchored. Raising the card to ~48vh will cover more of the map; keep controls in their current bottom-left stack **above** the card (or pinned to the card’s top edge) so they are not trapped under the taller pane. Prefer a CSS adjustment driven by the new card height rather than a second absolute coordinate system.

In `cards` mode, controls stay visible (top of the reading panel or as a sticky bar on the panel) so Focus/Show map remains reachable without hunting.

### Persistence

Session-only React state. No URL hash/query encoding. Deep links remain event-based. Leaving explore / welcome discards `viewMode` with unmount.

### Edge cases

| Case | Behavior |
|------|----------|
| Event / interlude change while in `cards` | Stay in `cards`; do not force mobile peek |
| Autoplay in `cards` | Advance events normally; map stays hidden until exit |
| Resize across mobile/desktop breakpoint | Keep `viewMode`; only chrome layout changes |
| Data interludes | Same modes; taller map-mode headroom; full viewport in cards mode |
| Return `cards` → `map` | Show map, `invalidateSize`, keep current event/camera |
| Search input focused | `C` / arrows ignored (existing input guard) |
| Shortcuts panel open | `Escape` closes help first; does not also exit cards in the same keypress |

### Implementation touchpoints

- `client/src/components/ExploreView.jsx` — `viewMode` state + root class; CSS-hide map; `invalidateSize` on show; Focus button in `controlsContent`; gate wheel handler; `C` / `Escape` keys; hide colony/legend bits in filters when `cards`
- `client/src/App.css` — taller `.desktop-event-card` (+ landscape override); `.view-mode-cards` full-viewport card + control placement; map container hidden rules
- `client/src/components/MobileBottomSheet.jsx` — `locked` / `viewMode` prop: force full snap, disable peek-on-event-change and handle collapse while locked
- `client/src/components/KeyboardShortcuts.jsx` — `C` / `Escape` (exit cards) entries
- `Map.jsx` only if an imperative `invalidateSize` hook/ref is needed; prefer minimal surface

### Success criteria

- Desktop default card uses a clear screen-relative height (~48vh, with px floor) with map still visible and usable; landscape short screens are not stuck on the old 35vh cap.
- One explicit control in the shared controls row (plus `C` / `Esc`) enters and exits a cards-only view where the map is completely gone.
- In cards mode, the user can scroll long card/interlude content without the explore wheel handler hijacking the gesture.
- Behavior is consistent on mobile and desktop; timeline navigation in cards mode does not force the map (or mobile peek) back.
- Returning to map mode restores a correctly sized Leaflet map at the same event.
