import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion as Motion, useAnimation, useDragControls } from 'framer-motion';

const SNAP_PEEK_RATIO = 0.55;
const SNAP_FULL_RATIO = 0.9;

const SWIPE_OFFSET = 56;
const SWIPE_VELOCITY = 350;

const snapSpring = { type: 'spring', stiffness: 300, damping: 30 };

function getSnapPoints(vh) {
  return {
    peek: vh * (1 - SNAP_PEEK_RATIO),
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
  const [snapName, setSnapName] = useState('peek');
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

  // Bounce hint on first load (skip when locked into cards focus)
  useEffect(() => {
    if (locked) return;
    // Session storage can be unavailable in privacy-restricted contexts.
    let hasSeenBounce = true;
    try {
      hasSeenBounce = Boolean(sessionStorage.getItem('amreviz-sheet-bounce'));
    } catch {
      hasSeenBounce = false;
    }
    if (!hasSeenBounce) {
      const bounce = async () => {
        await new Promise(r => setTimeout(r, 1000));
        await sheetControls.start({ y: snaps.peek - 40, transition: { duration: 0.3 } });
        await sheetControls.start({ y: snaps.peek, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        try {
          sessionStorage.setItem('amreviz-sheet-bounce', 'true');
        } catch {
          // Ignore: the hint simply replays next session.
        }
      };
      bounce();
    }
  }, [sheetControls, snaps.peek, locked]);

  // Force full while locked into cards focus (adjust during render, like eventId)
  if (locked && snapName !== 'full') {
    setSnapName('full');
  }

  // Collapse back to peek when the event changes so the map stays in view
  // (suppressed while locked in cards focus mode)
  const [lastEventId, setLastEventId] = useState(eventId);
  if (eventId !== lastEventId) {
    setLastEventId(eventId);
    if (!locked) setSnapName('peek');
  }

  // Rewind the card whenever the sheet returns to peek
  useEffect(() => {
    if (snapName === 'peek' && contentRef.current) contentRef.current.scrollTop = 0;
  }, [snapName, eventId]);

  useEffect(() => {
    sheetControls.start({ y: snaps[snapName], transition: snapSpring });
  }, [vh, snaps, snapName, sheetControls]);

  const snapTo = useCallback((name) => {
    setSnapName(name);
    sheetControls.start({ y: snaps[name], transition: snapSpring });
  }, [snaps, sheetControls]);

  const handleDragStart = useCallback(() => {
    dragStartY.current = snaps[snapName];
  }, [snaps, snapName]);

  // Handle-only drag → snap the sheet
  const handleDragEnd = useCallback((_e, info) => {
    const finalY = (dragStartY.current ?? snaps[snapName]) + info.offset.y;
    const [name, snapY] = closestSnap(finalY, snaps);
    setSnapName(name);
    sheetControls.start({ y: snapY, transition: snapSpring });
  }, [snaps, snapName, sheetControls]);

  const isFullOpen = snapName === 'full';

  // Vertical swipes on the sheet body navigate events: up = next, down = prev.
  // Sheet expand/collapse is reserved for the drag handle, and at full
  // expansion the content scrolls natively instead.
  useEffect(() => {
    if (isFullOpen) return;

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

      if (Math.abs(dy) <= Math.abs(dx)) return;

      const velocity = Math.abs(dy) / Math.max(dt, 1) * 1000;
      const triggered = Math.abs(dy) > SWIPE_OFFSET || velocity > SWIPE_VELOCITY;
      if (!triggered) return;

      if (dy < 0 && hasNext) {
        onNext?.();
      } else if (dy > 0 && hasPrev) {
        onPrev?.();
      } else {
        // Rubber-band nudge at either end of the timeline
        const rest = snaps[snapName];
        sheetControls
          .start({ y: rest + (dy < 0 ? -14 : 14), transition: { duration: 0.12 } })
          .then(() => sheetControls.start({ y: rest, transition: snapSpring }));
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isFullOpen, hasNext, hasPrev, onNext, onPrev, snaps, snapName, sheetControls]);

  return (
    <Motion.div
      ref={sheetRef}
      className={`bottom-sheet ${darkMode ? 'dark' : ''}`}
      initial={{ y: snaps.peek }}
      animate={sheetControls}
      drag={locked ? false : 'y'}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={
        locked
          ? { top: snaps.full, bottom: snaps.full }
          : { top: snaps.full, bottom: snaps.peek }
      }
      dragElastic={locked ? 0 : { top: 0.2, bottom: 0.2 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: vh,
        zIndex: 700,
        touchAction: isFullOpen ? 'pan-y' : 'none',
        bottom: 0
      }}
    >
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

      <div className="bottom-sheet-controls">
        {controlsContent}
      </div>

      {panelContent}

      <div
        className="bottom-sheet-content"
        ref={contentRef}
        style={{
          overflowY: isFullOpen ? 'auto' : 'hidden',
          touchAction: isFullOpen ? 'pan-y' : 'none',
          paddingBottom: `${Math.round(snaps.full) + 24}px` // sheet bottom sits below the viewport
        }}
      >
        {children}
      </div>
    </Motion.div>
  );
}
