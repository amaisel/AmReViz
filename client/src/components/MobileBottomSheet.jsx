import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence, useAnimation, useDragControls } from 'framer-motion';
import { MOBILE_SHEET_PEEK_RATIO } from '../constants/layout';
import useReducedMotion from '../hooks/useReducedMotion';

const SNAP_FULL_RATIO = 0.9;

const SWIPE_OFFSET = 56;
const SWIPE_VELOCITY = 350;

const snapSpring = { type: 'spring', stiffness: 300, damping: 30 };
// The sheet still has to travel — it is a position, not an embellishment — so
// reduced motion shortens the trip and drops the overshoot rather than
// teleporting the panel under the reader's thumb.
const snapDirect = { type: 'tween', duration: 0.12, ease: 'easeOut' };

function getSnapPoints(vh) {
  return {
    peek: vh * (1 - MOBILE_SHEET_PEEK_RATIO),
    full: vh * (1 - SNAP_FULL_RATIO),
  };
}

function closestSnap(y, snaps) {
  const entries = Object.entries(snaps);
  let best = entries[0];
  for (const entry of entries) {
    if (Math.abs(entry[1] - y) < Math.abs(best[1] - y)) best = entry;
  }
  return best;
}

export default function MobileBottomSheet({
  children,
  panelContent,
  eventId,
  darkMode,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isPlaying = false,
  onTogglePlayback,
}) {
  const reduceMotion = useReducedMotion();
  const snapTransition = reduceMotion ? snapDirect : snapSpring;
  const [snapName, setSnapName] = useState('peek');
  const [panelOpen, setPanelOpen] = useState(false);
  const [vh, setVh] = useState(window.innerHeight);
  const dragStartY = useRef(null);
  const sheetControls = useAnimation();
  const dragControls = useDragControls();
  const contentRef = useRef(null);
  const sheetRef = useRef(null);

  const snaps = useMemo(() => getSnapPoints(vh), [vh]);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Set once the reader moves the sheet themselves. The bounce hint below runs
  // on a timer and animates back to peek; without this it would land on top of
  // an expand that happened while it was waiting, leaving the sheet at peek
  // with `snapName` — and so the chevron and aria-label — still saying 'full'.
  const userMovedSheet = useRef(false);

  // Bounce hint on first load
  useEffect(() => {
    // Session storage can be unavailable in privacy-restricted contexts.
    let hasSeenBounce = true;
    try {
      hasSeenBounce = Boolean(sessionStorage.getItem('amreviz-sheet-bounce'));
    } catch {
      hasSeenBounce = false;
    }
    // The bounce is pure advertisement: it exists to say "this drags". That is
    // exactly the sort of unrequested movement the preference turns off.
    if (!hasSeenBounce && !reduceMotion) {
      const bounce = async () => {
        await new Promise(r => setTimeout(r, 1000));
        // The hint has nothing to teach someone who already worked it out.
        if (userMovedSheet.current) return;
        await sheetControls.start({ y: snaps.peek - 40, transition: { duration: 0.3 } });
        if (userMovedSheet.current) return;
        await sheetControls.start({ y: snaps.peek, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        try {
          sessionStorage.setItem('amreviz-sheet-bounce', 'true');
        } catch {
          // Ignore: the hint simply replays next session.
        }
      };
      bounce();
    }
  }, [sheetControls, snaps.peek, reduceMotion]);

  // Collapse back to peek when the event changes so the map stays in view
  const [lastEventId, setLastEventId] = useState(eventId);
  if (eventId !== lastEventId) {
    setLastEventId(eventId);
    setPanelOpen(false);
    setSnapName('peek');
  }

  // Rewind the card whenever the sheet returns to peek
  useEffect(() => {
    if (snapName === 'peek' && contentRef.current) contentRef.current.scrollTop = 0;
  }, [snapName, eventId]);

  useEffect(() => {
    sheetControls.start({ y: snaps[snapName], transition: snapTransition });
  }, [vh, snaps, snapName, sheetControls, snapTransition]);

  const snapTo = useCallback((name) => {
    userMovedSheet.current = true;
    setSnapName(name);
    sheetControls.start({ y: snaps[name], transition: snapTransition });
  }, [snaps, sheetControls, snapTransition]);

  const handleDragStart = useCallback(() => {
    userMovedSheet.current = true;
    dragStartY.current = snaps[snapName];
  }, [snaps, snapName]);

  // Handle-only drag → snap the sheet
  const handleDragEnd = useCallback((_e, info) => {
    const finalY = (dragStartY.current ?? snaps[snapName]) + info.offset.y;
    const [name, snapY] = closestSnap(finalY, snaps);
    setSnapName(name);
    sheetControls.start({ y: snapY, transition: snapTransition });
  }, [snaps, snapName, sheetControls, snapTransition]);

  const isFullOpen = snapName === 'full';

  // Horizontal swipes on the sheet body move along the timeline: left = next,
  // right = prev, the direction the story already runs. Vertical is left
  // entirely to the card — reading a long entry should never advance the
  // story — and sheet expand/collapse stays on the drag handle.
  //
  // Because the two axes no longer compete, this stays active at both snap
  // points rather than switching off once the sheet is fully open.
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    let start = null;

    const onTouchStart = (e) => {
      // Gestures that begin on the handle belong to the sheet drag
      if (e.target.closest('.bottom-sheet-handle')) {
        start = null;
        return;
      }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
    };

    const onTouchEnd = (e) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      const dt = performance.now() - start.t;
      start = null;

      // Anything more vertical than horizontal was a scroll, not a swipe.
      if (Math.abs(dx) <= Math.abs(dy)) return;

      const velocity = Math.abs(dx) / Math.max(dt, 1) * 1000;
      const triggered = Math.abs(dx) > SWIPE_OFFSET || velocity > SWIPE_VELOCITY;
      if (!triggered) return;

      if (dx < 0 && hasNext) {
        onNext?.();
      } else if (dx > 0 && hasPrev) {
        onPrev?.();
      } else {
        // Rubber-band nudge at either end of the timeline
        const rest = snaps[snapName];
        sheetControls
          .start({ x: dx < 0 ? -14 : 14, y: rest, transition: { duration: 0.12 } })
          .then(() => sheetControls.start({ x: 0, y: rest, transition: snapTransition }));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [hasNext, hasPrev, onNext, onPrev, snaps, snapName, sheetControls, snapTransition]);

  return (
    <Motion.div
      ref={sheetRef}
      className={`bottom-sheet ${darkMode ? 'dark' : ''}`}
      initial={{ y: snaps.peek }}
      animate={sheetControls}
      drag="y"
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ top: snaps.full, bottom: snaps.peek }}
      dragElastic={{ top: 0.2, bottom: 0.2 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: vh,
        zIndex: 700,
        // Vertical belongs to the browser now that it no longer navigates, so
        // the card scrolls natively once the sheet is open. Horizontal is left
        // unclaimed for the swipe handler above.
        touchAction: 'pan-y',
        bottom: 0
      }}
    >
      <div className="bottom-sheet-header">
        {/* Step controls live in the header rather than at the foot of the
            card. At peek the card cannot scroll, so the Prev/Next pair at its
            bottom sat permanently below the fold — leaving a swipe, taught by
            a hint that dismisses itself after six seconds, as the only way to
            move. These stay put at both snap points. */}
        <button
          type="button"
          className="sheet-step-btn"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous event"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="10 12 6 8 10 4" />
          </svg>
        </button>

        <button
          type="button"
          className="bottom-sheet-handle"
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => snapTo(snapName === 'peek' ? 'full' : 'peek')}
          aria-label={isFullOpen ? 'Collapse event details' : 'Expand event details'}
          aria-expanded={isFullOpen}
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
          className="sheet-step-btn"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next event"
        >
          <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 4 10 8 6 12" />
          </svg>
        </button>

        {/* While the story plays, the controls panel — where Play lives —
            closes at every event change to keep the map in view, which took
            Pause with it: stopping meant reopening the panel and tapping
            within the four-second window before it closed again. Pause takes
            the panel toggle's slot for as long as playback runs. */}
        {isPlaying ? (
          <button
            type="button"
            className="sheet-panel-toggle sheet-pause-btn active"
            onClick={onTogglePlayback}
            aria-label="Pause playback"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </button>
        ) : (
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
        )}
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

      <div
        className={`bottom-sheet-content ${isFullOpen ? 'expanded' : 'peek'}`}
        ref={contentRef}
        style={{
          // Still tied to the snap: at peek the sheet is taller than its
          // visible strip, so scrolling here would run the card up behind the
          // fold. Expanding the sheet is what makes a long entry readable.
          overflowY: isFullOpen ? 'auto' : 'hidden',
          touchAction: 'pan-y',
          paddingBottom: `${Math.round(snaps.full) + 24}px` // sheet bottom sits below the viewport
        }}
      >
        {children}
      </div>
    </Motion.div>
  );
}
