import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map';
import EventCard from './EventCard';
import HorizontalTimeline from './HorizontalTimeline';
import SearchBar from './SearchBar';

function FilterBar({ activeFilters, onToggle }) {
  const types = [
    { id: 'battle', label: 'Battles', icon: '\u2694\uFE0F', color: '#7A1212' },
    { id: 'political', label: 'Political', icon: '\uD83D\uDCDC', color: '#0A244A' },
    { id: 'diplomatic', label: 'Diplomatic', icon: '\uD83E\uDD1D', color: '#C5A02F' },
    { id: 'military', label: 'Military', icon: '\uD83C\uDFF0', color: '#228B22' },
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
          <span className="filter-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function ExploreView({
  events,
  colonyBoundaries,
  darkMode,
  onExitToWelcome
}) {
  // Mode: 'guided' (sequential story) or 'free' (open exploration)
  const [mode, setMode] = useState('guided');

  // Guided mode state
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [fillColonies, setFillColonies] = useState(true);
  const isScrolling = useRef(false);
  const accumulatedDelta = useRef(0);

  // Free mode state
  const [activeEventId, setActiveEventId] = useState(null);
  const [activeFilters, setActiveFilters] = useState(
    new Set(['battle', 'political', 'diplomatic', 'military'])
  );

  // Derived state
  const currentEvent = events[currentEventIndex];
  const currentYear = currentEvent?.year || 1773;
  const visibleEvents = events.slice(0, currentEventIndex + 1);
  const progress = ((currentEventIndex + 1) / events.length) * 100;

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  // In guided mode, active event is the current sequential event
  // In free mode, it's whatever was clicked
  const displayEvent = mode === 'guided'
    ? currentEvent
    : events.find(e => e.id === activeEventId) || null;

  // Events to show on the map
  const mapEvents = mode === 'guided' ? visibleEvents : filteredEvents;

  // Map active event ID
  const mapActiveId = mode === 'guided' ? currentEvent?.id : activeEventId;

  // --- Mode toggling ---
  const toggleMode = useCallback(() => {
    if (mode === 'guided') {
      // Guided → Free: keep current event selected
      setActiveEventId(currentEvent?.id || null);
      setMode('free');
    } else {
      // Free → Guided: jump to selected event's index
      if (activeEventId) {
        const idx = events.findIndex(e => e.id === activeEventId);
        if (idx !== -1) setCurrentEventIndex(idx);
      }
      setMode('guided');
    }
  }, [mode, currentEvent?.id, activeEventId, events]);

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

  // --- Guided mode: wheel navigation ---
  useEffect(() => {
    if (mode !== 'guided') return;
    const SCROLL_THRESHOLD = 80;

    const handleWheel = (e) => {
      if (isScrolling.current) return;

      accumulatedDelta.current += e.deltaY;

      if (Math.abs(accumulatedDelta.current) >= SCROLL_THRESHOLD) {
        isScrolling.current = true;

        if (accumulatedDelta.current > 0) {
          setCurrentEventIndex(prev => Math.min(prev + 1, events.length - 1));
        } else {
          setCurrentEventIndex(prev => Math.max(prev - 1, 0));
        }

        accumulatedDelta.current = 0;
        setTimeout(() => { isScrolling.current = false; }, 400);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [events.length, mode]);

  // --- Keyboard navigation ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      // F key: toggle mode
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleMode();
          return;
        }
      }

      // Arrow keys: only in guided mode
      if (mode !== 'guided') return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        isScrolling.current = true;
        setCurrentEventIndex(prev => Math.min(prev + 1, events.length - 1));
        setTimeout(() => { isScrolling.current = false; }, 300);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        isScrolling.current = true;
        setCurrentEventIndex(prev => Math.max(prev - 1, 0));
        setTimeout(() => { isScrolling.current = false; }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events.length, mode, toggleMode]);

  // --- Map event click handler ---
  const handleMapEventClick = useCallback((id) => {
    if (mode === 'guided') {
      const idx = events.findIndex(e => e.id === id);
      if (idx !== -1) setCurrentEventIndex(idx);
    } else {
      setActiveEventId(id);
    }
  }, [mode, events]);

  // --- Search select handler ---
  const handleSearchSelect = useCallback((id) => {
    setActiveEventId(id);
  }, []);

  return (
    <div className={`scrollytelling-view ${darkMode ? 'dark' : ''}`}>
      {/* Full-screen Map */}
      <div className="scrolly-map-container">
        <Map
          events={mapEvents}
          colonyBoundaries={colonyBoundaries}
          activeEventId={mapActiveId}
          onEventClick={handleMapEventClick}
          showColonies={true}
          fillColonies={mode === 'guided' ? fillColonies : false}
          darkMode={darkMode}
          hideFutureEvents={false}
        />
      </div>

      {/* Guided mode: Year Counter */}
      <AnimatePresence>
        {mode === 'guided' && (
          <motion.div
            key="year-counter"
            className="year-counter"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="year-label">Year</span>
            <motion.span
              className="year-value"
              key={currentYear}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {currentYear}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided mode: Progress Bar */}
      <AnimatePresence>
        {mode === 'guided' && (
          <motion.div
            key="progress-bar"
            className="scrolly-progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="progress-track">
              <motion.div
                className="progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <motion.div
        className="explore-controls"
        layout
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <button
          className={`explore-mode-toggle ${mode}`}
          onClick={toggleMode}
        >
          {mode === 'guided' ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Free Explore
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Guided Tour
            </>
          )}
        </button>

        {mode === 'guided' && (
          <motion.label
            className="checkbox-label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <input
              type="checkbox"
              checked={fillColonies}
              onChange={() => setFillColonies(!fillColonies)}
            />
            Color colonies
          </motion.label>
        )}

        <AnimatePresence>
          {mode === 'free' && (
            <motion.div
              className="free-mode-controls"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
              <SearchBar
                events={events}
                onEventSelect={handleSearchSelect}
                darkMode={darkMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Event Card */}
      <AnimatePresence mode="wait">
        <EventCard event={displayEvent} darkMode={darkMode} />
      </AnimatePresence>

      {/* Free mode: Horizontal Timeline at bottom */}
      <AnimatePresence>
        {mode === 'free' && (
          <motion.div
            className="explore-timeline-container"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.3 }}
          >
            <HorizontalTimeline
              events={filteredEvents}
              activeEventId={activeEventId}
              onEventClick={setActiveEventId}
              darkMode={darkMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guided mode: Scroll hint on first event */}
      {mode === 'guided' && currentEventIndex === 0 && (
        <motion.div
          className="scroll-hint-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1 }}
        >
          <span>Scroll to advance through history</span>
          <motion.span
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.span>
        </motion.div>
      )}

      {/* Guided mode: End of Timeline */}
      {mode === 'guided' && currentEventIndex === events.length - 1 && (
        <motion.div
          className="story-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>End of Timeline</p>
          <div className="story-end-actions">
            <button onClick={onExitToWelcome}>Start Over</button>
            <button onClick={toggleMode}>Explore Freely</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
