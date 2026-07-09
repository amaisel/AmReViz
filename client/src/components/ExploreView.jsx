import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map';
import EventCard from './EventCard';
import DataInterludeCard from './DataInterludeCard';
import SearchBar from './SearchBar';
import MobileBottomSheet from './MobileBottomSheet';
import { interludes } from '../data/interludes';

// Interleave data interludes into the event sequence after their anchor events
function buildStoryItems(events) {
  const items = [];
  for (const event of events) {
    items.push({ kind: 'event', key: `event-${event.id}`, event });
    for (const interlude of interludes) {
      if (interlude.afterEventId === event.id) {
        items.push({ kind: 'interlude', key: interlude.id, interlude, anchor: event });
      }
    }
  }
  return items;
}

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
  onExitToWelcome,
  initialEventId,
  onConsumeInitialEvent,
  onEventChange, // New prop to sync URL
}) {
  const storyItems = useMemo(() => buildStoryItems(events), [events]);

  // Seed from the deep-linked event so the mount-time URL sync doesn't
  // clobber the requested event with event 0
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialEventId != null) {
      const idx = storyItems.findIndex(it => it.kind === 'event' && it.event.id === initialEventId);
      if (idx !== -1) return idx;
    }
    return 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  // Timeline feature disabled for now; downstream layout props still expect it
  const timelineOpen = false;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(4000);
  const [fillColonies, setFillColonies] = useState(false);
  const [activeFilters, setActiveFilters] = useState(
    new Set(['battle', 'political', 'diplomatic', 'military'])
  );
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 768px)').matches
  );

  // Derive the current story item; interludes anchor to the event before them
  // so the map, year chip, and URL stay on the last real event
  const currentItem = storyItems[currentIndex];
  const isInterlude = currentItem?.kind === 'interlude';
  const currentEvent = isInterlude ? currentItem.anchor : currentItem?.event;

  // Sync current event to URL when the selected event changes
  const lastSyncedEventId = useRef(null);
  useEffect(() => {
    if (!currentEvent || currentEvent.id === lastSyncedEventId.current) return;
    lastSyncedEventId.current = currentEvent.id;
    onEventChange?.(currentEvent.id);
  }, [currentEvent, onEventChange]);

  useEffect(() => {
    if (initialEventId != null) {
      // Interludes share their anchor event's URL — if the current item already
      // anchors to the requested event, the deep link is satisfied and jumping
      // would yank us off the interlude.
      if (currentEvent?.id !== initialEventId) {
        const idx = storyItems.findIndex(it => it.kind === 'event' && it.event.id === initialEventId);
        if (idx !== -1) {
          setCurrentIndex(idx);
          setIsPlaying(false);
        }
      }
      onConsumeInitialEvent?.();
    }
  }, [initialEventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const viewRef = useRef(null);
  const mapContainerRef = useRef(null);
  const isScrolling = useRef(false);
  const accumulatedDelta = useRef(0);
  const accumulatedDeltaX = useRef(0);

  const currentYear = currentEvent?.year || 1773;
  const progress = ((currentIndex + 1) / storyItems.length) * 100;

  const filteredEvents = useMemo(
    () => events.filter(e => activeFilters.has(e.type)),
    [events, activeFilters]
  );

  const anchorEventIndex = currentEvent ? events.indexOf(currentEvent) : 0;
  const mapEvents = filteredEvents.filter((_, i) => {
    const originalIndex = events.indexOf(filteredEvents[i]);
    return originalIndex <= anchorEventIndex;
  });

  const mapActiveId = currentEvent?.id;

  const speedIndex = SPEED_PRESETS.findIndex(s => s.ms === playSpeed);
  const speedLabel = SPEED_PRESETS[speedIndex]?.label || '1x';

  // --- Play/Pause auto-advance (interludes hold 1.5x longer for reading) ---
  useEffect(() => {
    if (!isPlaying) return;
    if (currentIndex >= storyItems.length - 1) {
      setIsPlaying(false);
      return;
    }
    const delay = storyItems[currentIndex]?.kind === 'interlude' ? playSpeed * 1.5 : playSpeed;
    const timer = setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, storyItems.length - 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [isPlaying, playSpeed, currentIndex, storyItems]);

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

  // --- Preset filters ---
  const FILTER_PRESETS = [
    { label: 'All Events', filters: ['battle', 'political', 'diplomatic', 'military'] },
    { label: 'Major Battles', filters: ['battle'] },
    { label: 'Political Milestones', filters: ['political'] },
    { label: 'Turning Points', filters: ['battle', 'diplomatic'] },
  ];

  const applyPreset = useCallback((filterIds) => {
    setActiveFilters(new Set(filterIds));
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
          setCurrentIndex(prev => Math.min(prev + 1, storyItems.length - 1));
        } else {
          setCurrentIndex(prev => Math.max(prev - 1, 0));
        }

        accumulatedDelta.current = 0;
        accumulatedDeltaX.current = 0;
        setTimeout(() => { isScrolling.current = false; }, LOCKOUT_MS);
      }
    };

    const el = viewRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [storyItems.length]);

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
        setCurrentIndex(prev => Math.min(prev + 1, storyItems.length - 1));
        setTimeout(() => { isScrolling.current = false; }, 300);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        isScrolling.current = true;
        setCurrentIndex(prev => Math.max(prev - 1, 0));
        setTimeout(() => { isScrolling.current = false; }, 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [storyItems.length]);

  // --- Jump to an event by id (map, timeline, search, interlude charts) ---
  const jumpToEvent = useCallback((id) => {
    setIsPlaying(false);
    const idx = storyItems.findIndex(it => it.kind === 'event' && it.event.id === id);
    if (idx !== -1) setCurrentIndex(idx);
  }, [storyItems]);

  const handleMapEventClick = jumpToEvent;
  const handleSearchSelect = jumpToEvent;

  // --- Prev/Next handlers ---
  const handlePrevEvent = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleNextEvent = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(prev => Math.min(prev + 1, storyItems.length - 1));
  }, [storyItems.length]);

  // --- Replay handler ---
  const handleReplay = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  // --- Onboarding hint (first visit) ---
  const [showHint, setShowHint] = useState(() => {
    try {
      return !sessionStorage.getItem('amreviz-hint-dismissed');
    } catch { return true; }
  });

  useEffect(() => {
    if (!showHint) return;
    const timer = setTimeout(() => {
      setShowHint(false);
      try { sessionStorage.setItem('amreviz-hint-dismissed', '1'); } catch {}
    }, 6000);
    return () => clearTimeout(timer);
  }, [showHint]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try { sessionStorage.setItem('amreviz-hint-dismissed', '1'); } catch {}
  }, []);

  const activeFilterCount = activeFilters.size;
  const isAtEnd = currentIndex === storyItems.length - 1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < storyItems.length - 1;

  const cardContent = isInterlude ? (
    <DataInterludeCard
      interlude={currentItem.interlude}
      darkMode={darkMode}
      timelineOpen={timelineOpen}
      onPrev={handlePrevEvent}
      onNext={handleNextEvent}
      hasPrev={hasPrev}
      hasNext={hasNext}
      onBattleClick={jumpToEvent}
    />
  ) : (
    <EventCard
      event={currentEvent}
      darkMode={darkMode}
      timelineOpen={timelineOpen}
      onPrev={handlePrevEvent}
      onNext={handleNextEvent}
      hasPrev={hasPrev}
      hasNext={hasNext}
    />
  );

  const filtersPanelContent = (
    <>
      <div className="filter-presets">
        {FILTER_PRESETS.map((preset) => {
          const isActive = preset.filters.length === activeFilters.size &&
            preset.filters.every(f => activeFilters.has(f));
          return (
            <button
              key={preset.label}
              className={`filter-preset-chip ${isActive ? 'active' : ''}`}
              onClick={() => applyPreset(preset.filters)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
      <label className="checkbox-label" style={{ marginTop: '0.5rem' }}>
        <input
          type="checkbox"
          checked={fillColonies}
          onChange={() => setFillColonies(!fillColonies)}
        />
        Color colonies
      </label>
      <div className="filters-legend-section">
        <h4 className="filters-legend-title">Map Legend</h4>
        <div className="filters-legend-rows">
          <span className="filters-legend-item">
            <span className="legend-dot" style={{ background: '#1e3a5f' }} />
            American
          </span>
          <span className="filters-legend-item">
            <span className="legend-dot" style={{ background: '#8b2323' }} />
            British
          </span>
        </div>
      </div>
    </>
  );

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
    <div className={`scrollytelling-view ${darkMode ? 'dark' : ''}`} ref={viewRef}>
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

      {/* Compact status chip — year + progress merged */}
      <div className="explore-status-chip">
        <motion.span
          className="status-chip-year"
          key={currentYear}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {currentYear}
        </motion.span>
        <div className="status-chip-progress">
          <div className="status-chip-track">
            <motion.div
              className="status-chip-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="status-chip-counter">{currentIndex + 1}/{storyItems.length}</span>
        </div>
      </div>

      {/* Desktop: absolute-positioned controls */}
      <div className={`explore-controls desktop-controls ${timelineOpen ? 'timeline-open' : ''}`}>
        {controlsContent}
      </div>

      {/* Filters panel — floating above controls on desktop, inside the sheet on mobile */}
      <AnimatePresence>
        {filtersOpen && !isMobile && (
          <motion.div
            className={`filters-panel ${timelineOpen ? 'timeline-open' : ''}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {filtersPanelContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: bottom-positioned event or interlude card */}
      <div className={`desktop-event-card ${timelineOpen ? 'timeline-open' : ''}`}>
        {cardContent}
      </div>

      {/* Mobile/Tablet: draggable bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          eventId={currentItem?.key}
          darkMode={darkMode}
          controlsContent={controlsContent}
          onPrev={handlePrevEvent}
          onNext={handleNextEvent}
          hasPrev={hasPrev}
          hasNext={hasNext}
          panelContent={
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  className="sheet-filters-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filtersPanelContent}
                </motion.div>
              )}
            </AnimatePresence>
          }
        >
          {cardContent}
        </MobileBottomSheet>
      )}

      {/* Onboarding hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            className="explore-onboarding-hint"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
          >
            <span>
              {isMobile
                ? 'Swipe up or down to move through events'
                : 'Use arrow keys, scroll, or Play to move through events'}
            </span>
            <button className="hint-dismiss" onClick={dismissHint} aria-label="Dismiss hint">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
