import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, useAnimation, useDragControls } from 'framer-motion';

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
}) {
  const [snapName, setSnapName] = useState('peek');
  const [vh, setVh] = useState(window.innerHeight);
  const dragStartY = useRef(null);
  const sheetControls = useAnimation();
  const dragControls = useDragControls();
  const contentRef = useRef(null);
  const sheetRef = useRef(null);
  const lastFramerDrag = useRef({ t: 0, x: 0, y: 0 });

  const snaps = useMemo(() => getSnapPoints(vh), [vh]);

  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Bounce hint on first load
  useEffect(() => {
    const hasSeenBounce = sessionStorage.getItem('amreviz-sheet-bounce');
    if (!hasSeenBounce) {
      const bounce = async () => {
        await new Promise(r => setTimeout(r, 1000));
        await sheetControls.start({ y: snaps.peek - 40, transition: { duration: 0.3 } });
        await sheetControls.start({ y: snaps.peek, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        sessionStorage.setItem('amreviz-sheet-bounce', 'true');
      };
      bounce();
    }
  }, [sheetControls, snaps.peek]);

  // Collapse back to peek when the event changes so the map stays in view
  const [lastEventId, setLastEventId] = useState(eventId);
  if (eventId !== lastEventId) {
    setLastEventId(eventId);
    setSnapName('peek');
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

  const handleDragEnd = useCallback((_e, info) => {
    const { offset, velocity } = info;
    lastFramerDrag.current = { t: performance.now(), x: offset.x, y: offset.y };

    // Horizontal swipe → navigate between events
    if (Math.abs(offset.x) > Math.abs(offset.y)) {
      if ((offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) && hasNext) {
        onNext?.();
      } else if ((offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) && hasPrev) {
        onPrev?.();
      }
      sheetControls.start({ x: 0, y: snaps[snapName], transition: snapSpring });
      return;
    }

    // Vertical drag → snap the sheet
    const finalY = (dragStartY.current ?? snaps[snapName]) + offset.y;
    const [name, snapY] = closestSnap(finalY, snaps);
    setSnapName(name);
    sheetControls.start({ x: 0, y: snapY, transition: snapSpring });
  }, [snaps, snapName, sheetControls, onPrev, onNext, hasPrev, hasNext]);

  const isFullOpen = snapName === 'full';

  // Fallback swipe detection from raw touch events. Some browsers cancel the
  // pointer stream mid-gesture (pointercancel) and framer's drag only sees a
  // truncated offset; raw touchstart/touchend still report the full gesture.
  // Skipped whenever framer saw (and therefore handled) the whole gesture.
  useEffect(() => {
    if (isFullOpen) return; // content scrolls natively at full — don't fight it

    const el = sheetRef.current;
    if (!el) return;
    let start = null;

    const onTouchStart = (e) => {
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchEnd = (e) => {
      if (!start) return;
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      start = null;

      const framer = lastFramerDrag.current;
      const framerSawGesture =
        performance.now() - framer.t < 300 &&
        Math.hypot(framer.x, framer.y) >= Math.hypot(dx, dy) * 0.8;
      if (framerSawGesture) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx <= -SWIPE_OFFSET && hasNext) onNext?.();
        else if (dx >= SWIPE_OFFSET && hasPrev) onPrev?.();
        sheetControls.start({ x: 0, y: snaps[snapName], transition: snapSpring });
      } else if (dy <= -SWIPE_OFFSET) {
        snapTo('full');
      } else if (dy >= SWIPE_OFFSET) {
        snapTo('peek');
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [isFullOpen, hasNext, hasPrev, onNext, onPrev, snapTo, snaps, snapName, sheetControls]);

  return (
    <motion.div
      ref={sheetRef}
      className={`bottom-sheet ${darkMode ? 'dark' : ''}`}
      initial={{ y: snaps.peek }}
      animate={sheetControls}
      drag
      dragDirectionLock
      dragListener={!isFullOpen}
      dragControls={dragControls}
      dragConstraints={{ top: snaps.full, bottom: snaps.peek, left: 0, right: 0 }}
      dragElastic={{ top: 0.2, bottom: 0.2, left: 0.5, right: 0.5 }}
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
      <div
        className="bottom-sheet-handle"
        onPointerDown={(e) => { if (isFullOpen) dragControls.start(e); }}
        onClick={() => snapTo(snapName === 'peek' ? 'full' : 'peek')}
        aria-label={isFullOpen ? 'Collapse event details' : 'Expand event details'}
        role="button"
      >
        <span className={`bottom-sheet-chevron ${snapName !== 'peek' ? 'flipped' : ''}`}>
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 10 8 6 12 10"/>
          </svg>
        </span>
        <div className="bottom-sheet-bar" style={{ width: '40px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', marginTop: '-4px' }} />
      </div>

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
    </motion.div>
  );
}
