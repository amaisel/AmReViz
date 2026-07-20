import { useRef, useState, useCallback, useEffect } from 'react';
import { motion as Motion, useAnimation } from 'framer-motion';

const SNAP_PEEK_RATIO = 0.28;
const SNAP_HALF_RATIO = 0.56;
const SNAP_FULL_RATIO = 0.9;

function getSnapPoints(vh) {
  return {
    peek: vh * (1 - SNAP_PEEK_RATIO),
    half: vh * (1 - SNAP_HALF_RATIO),
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
  darkMode,
  timelineOpen,
}) {
  const [snapName, setSnapName] = useState('peek');
  const [vh, setVh] = useState(window.innerHeight);
  const dragStartY = useRef(null);
  const sheetControls = useAnimation();
  const contentRef = useRef(null);

  const snaps = getSnapPoints(vh);

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

  useEffect(() => {
    sheetControls.start({ y: snaps[snapName], transition: { type: 'spring', stiffness: 300, damping: 30 } });
  }, [vh, snaps, snapName, sheetControls]);

  const handleDragStart = useCallback(() => {
    dragStartY.current = snaps[snapName];
  }, [snaps, snapName]);

  const handleDragEnd = useCallback((_e, info) => {
    const finalY = (dragStartY.current ?? snaps[snapName]) + info.offset.y;
    const [name, snapY] = closestSnap(finalY, snaps);
    setSnapName(name);
    sheetControls.start({ y: snapY, transition: { type: 'spring', stiffness: 300, damping: 30 } });
  }, [snaps, snapName, sheetControls]);

  const isContentScrollable = snapName !== 'peek';

  const toggleSnap = useCallback(() => {
    const order = ['peek', 'half', 'full'];
    const next = order[(order.indexOf(snapName) + 1) % order.length];
    setSnapName(next);
    sheetControls.start({ y: snaps[next], transition: { type: 'spring', stiffness: 300, damping: 30 } });
  }, [sheetControls, snapName, snaps]);

  return (
    <Motion.div
      className={`bottom-sheet ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-active' : ''}`}
      initial={{ y: snaps.peek }}
      animate={sheetControls}
      drag="y"
      dragConstraints={{ top: snaps.full, bottom: snaps.peek }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ 
        position: 'absolute', 
        left: 0, 
        right: 0, 
        height: vh, 
        zIndex: 700, 
        touchAction: 'none',
        bottom: timelineOpen ? '160px' : 0
      }}
    >
      <button
        type="button"
        className="bottom-sheet-handle"
        onClick={toggleSnap}
        aria-label={`Event details are ${snapName === 'peek' ? 'collapsed' : snapName === 'half' ? 'half open' : 'fully open'}. Change height.`}
        aria-expanded={snapName !== 'peek'}
      >
        <span className={`bottom-sheet-chevron ${snapName !== 'peek' ? 'flipped' : ''}`}>
          <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 10 8 6 12 10"/>
          </svg>
        </span>
        <div className="bottom-sheet-bar" style={{ width: '40px', height: '4px', background: 'rgba(0,0,0,0.1)', borderRadius: '2px', marginTop: '-4px' }} />
      </button>

      <div
        className="bottom-sheet-content"
        ref={contentRef}
        style={{ 
          overflowY: isContentScrollable ? 'auto' : 'hidden',
          paddingBottom: '120px' // Space for controls
        }}
      >
        {children}
      </div>

      <div className="bottom-sheet-controls">
        {controlsContent}
      </div>
    </Motion.div>
  );
}
