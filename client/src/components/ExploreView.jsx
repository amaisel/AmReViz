import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map';
import EventCard from './EventCard';
import HorizontalTimeline from './HorizontalTimeline';
import SearchBar from './SearchBar';
import MobileBottomSheet from './MobileBottomSheet';

function FilterIcon({ type }) {
  switch (type) {
    case 'battle':
      return <svg viewBox="0 0 16 16" width="14" height="14"><line x1="4" y1="4" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
    case 'political':
      return <svg viewBox="0 0 16 16" width="14" height="14"><rect x="3.5" y="2" width="9" height="12" rx="1" stroke="currentColor" strokeWidth="1.6" fill="none"/><line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" strokeWidth="1.2"/><line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.2"/></svg>;
    case 'diplomatic':
      return <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.6" fill="none"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>;
    case 'military':
      return <svg viewBox="0 0 16 16" width="14" height="14"><path d="M8 2L13 5V10C13 12.5 10.5 14.5 8 15C5.5 14.5 3 12.5 3 10V5L8 2Z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg>;
    default:
      return null;
  }
}

function FilterBar({ activeFilters, onToggle }) {
  const types = [
    { id: 'battle', label: 'Battles', color: '#7A1212' },
    { id: 'political', label: 'Political', color: '#0A244A' },
    { id: 'diplomatic', label: 'Diplomatic', color: '#C5A02F' },
    { id: 'military', label: 'Military', color: '#228B22' },
  ];

  return (
    <div className="filter-bar">
      {types.map(t => (
        <button
          key={t.id}
          className={`filter-btn ${activeFilters.has(t.id) ? 'active' : ''}`}
          onClick={() => onToggle(t.id)}
          style={{ '--filter-color': t.color }}
        >
          <span className="filter-icon"><FilterIcon type={t.id} /></span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

const SPEED_PRESETS = [
  { label: '1x', ms: 4000 },
  { label: '1.5x', ms: 2500 },
  { label: '2x', ms: 1500 },
];

export default function ExploreView({
  events,
  colonyBoundaries,
  darkMode,
  onExitToWelcome
}) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(4000);
  const [fillColonies, setFillColonies] = useState(false);
  const [activeFilters, setActiveFilters] = useState(
    new Set(['battle', 'political', 'diplomatic', 'military'])
  );
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  );

  const mapContainerRef = useRef(null);
  const isScrolling = useRef(false);
  const accumulatedDelta = useRef(0);
  const accumulatedDeltaX = useRef(0);
  const touchStart = useRef(null);

  // Derived state
  const currentEvent = events[currentEventIndex];
  const currentYear = currentEvent?.year || 1773;
  const progress = ((currentEventIndex + 1) / events.length) * 100;

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const mapEvents = filteredEvents.filter((_, i) => {
    const originalIndex = events.indexOf(filteredEvents[i]);
    return originalIndex <= currentEventIndex;
  });

  const mapActiveId = currentEvent?.id;
  const displayEvent = currentEvent;

  const speedIndex = SPEED_PRESETS.findIndex(s => s.ms === playSpeed);
  const speedLabel = SPEED_PRESETS[speedIndex]?.label || '1x';

  // --- Play/Pause auto-advance ---
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentEventIndex(prev => {
        if (prev >= events.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, events.length]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  // --- Speed cycle ---
  const cycleSpeed = useCallback(() => {
    setPlaySpeed(prev => {
      const idx = SPEED_PRESETS.findIndex(s => s.ms === prev);
      const next = (idx + 1) % SPEED_PRESETS.length;
      return SPEED_PRESETS[next].ms;
    });
  }, []);

  // --- Filter toggle ---
  const toggleFilter = useCallback((type) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // --- Wheel navigation ---
  useEffect(() => {
    const THRESHOLD_X = 30;
    const THRESHOLD_Y = 50;
    const LOCKOUT_MS = 350;

    const handleWheel = (e) => {
      e.preventDefault();
      if (isScrolling.current) return;

      const useHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.5;

      if (useHorizontal) {
        accumulatedDeltaX.current += e.deltaX;
        accumulatedDelta.current = 0;
      } else {
        accumulatedDelta.current += e.deltaY;
        accumulatedDeltaX.current = 0;
      }

      const triggered = useHorizontal
        ? Math.abs(accumulatedDeltaX.current) >= THRESHOLD_X
        : Math.abs(accumulatedDelta.current) >= THRESHOLD_Y;

      if (triggered) {
        isScrolling.current = true;
        setIsPlaying(false);
        const delta = useHorizontal ? accumulatedDeltaX.current : accumulatedDelta.current;

        if (delta > 0) {
          setCurrentEventIndex(prev => Math.min(prev + 1, events.length - 1));
        } else {
          setCurrentEventIndex(prev => Math.max(prev - 1, 0));
        }

        accumulatedDelta.current = 0;
        accumulatedDeltaX.current = 0;
        setTimeout(() => { isScrolling.current = false; }, LOCKOUT_MS);
      }
    };

    const el = mapContainerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [events.length]);

  // --- Touch swipe navigation ---
  useEffect(() => {
    const SWIPE_THRESHOLD = 40;

    const handleTouchStart = (e) => {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = (e) => {
      if (!touchStart.current || isScrolling.current) return;
      const dx = touchStart.current.x - e.changedTouches[0].clientX;
      const dy = touchStart.current.y - e.changedTouches[0].clientY;
      touchStart.current = null;

      const useHorizontal = Math.abs(dx) > Math.abs(dy) * 0.5;
      const delta = useHorizontal ? dx : dy;

      if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        isScrolling.current = true;
        setIsPlaying(false);
        if (delta > 0) {
          setCurrentEventIndex(prev => Math.min(prev + 1, events.length - 1));
        } else {
          setCurrentEventIndex(prev => Math.max(prev - 1, 0));
        }
        setTimeout(() => { isScrolling.current = false; }, 350);
      }
    };

    const el = mapContainerRef.current;
    if (!el) return;
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [events.length]);

  // --- Keyboard navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        isScrolling.current = true;
        setCurrentEventIndex(prev => Math.min(prev + 1, events.length - 1));
        setTimeout(() => { isScrolling.current = false; }, 300);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        isScrolling.current = true;
        setCurrentEventIndex(prev => Math.max(prev - 1, 0));
        setTimeout(() => { isScrolling.current = false; }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events.length]);

  // --- Map event click handler ---
  const handleMapEventClick = useCallback((id) => {
    setIsPlaying(false);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) setCurrentEventIndex(idx);
  }, [events]);

  // --- Timeline click handler ---
  const handleTimelineClick = useCallback((id) => {
    setIsPlaying(false);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) setCurrentEventIndex(idx);
  }, [events]);

  // --- Search select handler ---
  const handleSearchSelect = useCallback((id) => {
    setIsPlaying(false);
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) setCurrentEventIndex(idx);
  }, [events]);

  // --- Replay handler ---
  const handleReplay = useCallback(() => {
    setCurrentEventIndex(0);
    setIsPlaying(true);
  }, []);

  const activeFilterCount = activeFilters.size;
  const isAtEnd = currentEventIndex === events.length - 1;

  const controlsContent = (
    <>
      <button
        className={`explore-btn ${isPlaying ? 'active' : ''}`}
        onClick={() => setIsPlaying(prev => !prev)}
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

      <button className="speed-indicator" onClick={cycleSpeed}>
        {speedLabel}
      </button>

      <span className="controls-divider" />

      <button
        className={`explore-btn ${timelineOpen ? 'active' : ''}`}
        onClick={() => setTimelineOpen(prev => !prev)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/></svg>
        Timeline
      </button>

      <span className="controls-divider" />

      <button
        className={`explore-btn ${filtersOpen ? 'active' : ''}`}
        onClick={() => setFiltersOpen(prev => !prev)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
        Filter
        {activeFilterCount < 4 && (
          <span className="filter-count-badge">{activeFilterCount}</span>
        )}
      </button>

      <SearchBar
        events={events}
        onEventSelect={handleSearchSelect}
        darkMode={darkMode}
      />
    </>
  );

  return (
    <div className={`scrollytelling-view ${darkMode ? 'dark' : ''}`}>
      {/* Full-screen Map */}
      <div className="scrolly-map-container" ref={mapContainerRef}>
        <Map
          events={mapEvents}
          colonyBoundaries={colonyBoundaries}
          activeEventId={mapActiveId}
          onEventClick={handleMapEventClick}
          showColonies={true}
          fillColonies={fillColonies}
          darkMode={darkMode}
          hideFutureEvents={false}
          scrollWheelZoom={false}
          timelineOpen={timelineOpen}
        />
      </div>

      {/* Year Counter — always visible */}
      <div className="year-counter">
        <span className="year-label">Year</span>
        <motion.span
          className="year-value"
          key={currentYear}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {currentYear}
        </motion.span>
      </div>

      {/* Progress Bar — always visible */}
      <div className="scrolly-progress">
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="progress-counter">{currentEventIndex + 1} of {events.length}</span>
      </div>

      {/* Desktop: absolute-positioned controls */}
      <div className={`explore-controls desktop-controls ${timelineOpen ? 'timeline-open' : ''}`}>
        {controlsContent}
      </div>

      {/* Filters panel — floating above controls */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className={`filters-panel ${timelineOpen ? 'timeline-open' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
            <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                checked={fillColonies}
                onChange={() => setFillColonies(!fillColonies)}
              />
              Color colonies
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: absolute-positioned event card */}
      <div className="desktop-event-card">
        <AnimatePresence mode="wait">
          <EventCard event={displayEvent} darkMode={darkMode} timelineOpen={timelineOpen} />
        </AnimatePresence>
      </div>

      {/* Desktop: Collapsible Timeline */}
      <AnimatePresence>
        {timelineOpen && (
          <motion.div
            className="explore-timeline-container desktop-timeline"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
          >
            <HorizontalTimeline
              events={filteredEvents}
              activeEventId={currentEvent?.id}
              onEventClick={handleTimelineClick}
              darkMode={darkMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile/Tablet: draggable bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          eventId={currentEvent?.id}
          darkMode={darkMode}
          controlsContent={controlsContent}
          timelineContent={
            timelineOpen ? (
              <HorizontalTimeline
                events={filteredEvents}
                activeEventId={currentEvent?.id}
                onEventClick={handleTimelineClick}
                darkMode={darkMode}
              />
            ) : null
          }
        >
          <EventCard event={displayEvent} darkMode={darkMode} timelineOpen={timelineOpen} />
        </MobileBottomSheet>
      )}

      {/* End of Timeline overlay */}
      {isAtEnd && (
        <motion.div
          className="story-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>End of Timeline</p>
          <div className="story-end-actions">
            <button className="explore-btn" onClick={handleReplay}>Replay</button>
            <button className="explore-btn" onClick={onExitToWelcome}>Start Over</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
