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

| Mode | Map | Card pane |
|------|-----|-----------|
| `map` (default) | Full-bleed behind UI | Desktop: ~**48vh** max-height (screen-relative; data interludes slightly taller, e.g. ~56vh). Mobile: existing peek/full snaps unchanged |
| `cards` | Fully hidden (CSS hide / `aria-hidden`, **do not unmount** — preserve Leaflet camera/state) | Card fills the viewport; content scrolls. Mobile sheet locked to full height (no peek) |

Switching modes does **not** change `currentIndex` / event. Prev/next, play, filters, search, and year chip continue to work.

### Explicit control

- **Button** on card chrome:
  - Desktop: on the desktop event card chrome (near existing nav / header area), styled like existing explore controls.
  - Mobile: in the bottom sheet handle/controls row.
- Labels: **“Focus cards”** when in `map` mode; **“Show map”** when in `cards` mode. Icon + text on desktop; icon-only with `aria-label` on narrow widths is acceptable.
- **Keyboard:** `C` toggles mode. `Escape` exits `cards` → `map` only when already in `cards` mode and the shortcuts help panel is not open (help panel keeps first claim on `Escape`). Document both in `KeyboardShortcuts`.

### Chrome in `cards` mode

**Keep visible**

- Year / progress status chip
- Prev / next, play / speed, filters, search
- Event / interlude card content (full viewport)

**Hide**

- Map container (CSS-hidden, not unmounted) and map-only overlays
- Colony fill toggle (map-only); leave filters/search/play chrome as-is

Onboarding hint: optional one-line mention of the focus control; not required for v1.

### Persistence

Session-only React state. No URL hash/query encoding. Deep links remain event-based.

### Edge cases

| Case | Behavior |
|------|----------|
| Event / interlude change while in `cards` | Stay in `cards` |
| Autoplay in `cards` | Advance events normally; map stays hidden until exit |
| Resize across mobile/desktop breakpoint | Keep `viewMode`; only chrome layout changes |
| Data interludes | Same modes; taller map-mode headroom; full viewport in cards mode |
| Leaving explore / welcome | State discarded with unmount |

### Implementation touchpoints

- `client/src/components/ExploreView.jsx` — `viewMode` state, conditional map render/visibility, pass toggle into card/sheet, keyboard handlers
- `client/src/App.css` — taller `.desktop-event-card` in map mode; full-viewport cards layout class
- `client/src/components/MobileBottomSheet.jsx` — accept/lock full when `viewMode === 'cards'`; host or receive toggle
- Desktop card chrome / `EventCard` as needed for the toggle button
- `client/src/components/KeyboardShortcuts.jsx` — `C` / `Escape` entries

### Success criteria

- Desktop default card uses a clear screen-relative height (~48vh) with map still visible and usable.
- One explicit control (plus `C` / `Esc`) enters and exits a cards-only view where the map is completely gone.
- Behavior is consistent on mobile and desktop.
- Navigating the timeline in cards mode does not force the map back.
