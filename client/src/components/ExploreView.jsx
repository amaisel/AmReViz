import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import EventMap from './Map';
import EventCard from './EventCard';
import HorizontalTimeline from './HorizontalTimeline';
import SearchBar from './SearchBar';
import MobileBottomSheet from './MobileBottomSheet';
import { MOBILE_LAYOUT_QUERY } from '../constants/layout';

const SPEED_PRESETS = [
  { label: '1×', ms: 4200 },
  { label: '1.5×', ms: 2800 },
  { label: '2×', ms: 1800 },
];

const EVENT_TYPES = [
  { id: 'battle', label: 'Battles', color: '#9e2a2b' },
  { id: 'political', label: 'Political', color: '#163d67' },
  { id: 'military', label: 'Military', color: '#4f6b55' },
];

function FilterIcon({ type }) {
  if (type === 'battle') {
    return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>;
  }
  if (type === 'political') {
    return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h8v11H4zM6 6h4M6 8.5h4" /></svg>;
  }
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5 12.5 5v4.5c0 2-2 3.5-4.5 4-2.5-.5-4.5-2-4.5-4V5z" /></svg>;
}

function FilterBar({ activeFilters, onToggle }) {
  return (
    <div className="filter-bar" aria-label="Map event layers">
      {EVENT_TYPES.map(type => {
        const active = activeFilters.has(type.id);
        return (
          <button
            key={type.id}
            className={`filter-btn ${active ? 'active' : ''}`}
            onClick={() => onToggle(type.id)}
            style={{ '--filter-color': type.color }}
            aria-pressed={active}
          >
            <span className="filter-icon"><FilterIcon type={type.id} /></span>
            {type.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ExploreView({
  events,
  chapters,
  colonyBoundaries,
  darkMode,
  onExitToWelcome,
  navigationRequest = null,
  onEventChange,
  keyboardShortcutsOpen = false,
}) {
  const [currentEventIndex, setCurrentEventIndex] = useState(() => {
    if (navigationRequest?.eventId == null) return 0;
    const initialIndex = events.findIndex(event => event.id === navigationRequest.eventId);
    return initialIndex === -1 ? 0 : initialIndex;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(SPEED_PRESETS[0].ms);
  const [fillColonies, setFillColonies] = useState(false);
  const [activeFilters, setActiveFilters] = useState(new Set(EVENT_TYPES.map(type => type.id)));
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_LAYOUT_QUERY).matches);
  const storyStepRefs = useRef(new Map());
  const observerLock = useRef(false);
  const unlockObserverTimeout = useRef(null);
  const scrollSettleCleanup = useRef(null);
  const handledNavigationKey = useRef(null);
  const reduceMotion = useReducedMotion();

  const currentEvent = events[currentEventIndex];
  const activeChapterIndex = chapters.findIndex(
    chapter => currentEvent.id >= chapter.startId && currentEvent.id <= chapter.endId,
  );
  const activeChapter = chapters[Math.max(activeChapterIndex, 0)];
  const progress = ((currentEventIndex + 1) / events.length) * 100;
  const atLastEvent = currentEventIndex >= events.length - 1;
  const effectivelyPlaying = isPlaying && !atLastEvent;
  const filteredEvents = useMemo(
    () => events.filter(event => activeFilters.has(event.type) || event.id === currentEvent.id),
    [activeFilters, currentEvent.id, events],
  );

  const clearScrollLockTimers = useCallback(() => {
    if (unlockObserverTimeout.current != null) {
      window.clearTimeout(unlockObserverTimeout.current);
      unlockObserverTimeout.current = null;
    }
    if (scrollSettleCleanup.current) {
      scrollSettleCleanup.current();
      scrollSettleCleanup.current = null;
    }
  }, []);

  const lockObserverUntilScrollSettles = useCallback((maxWaitMs) => {
    clearScrollLockTimers();
    observerLock.current = true;

    let lastScrollY = window.scrollY;
    let sawScroll = false;
    let quietTimeout = null;

    const unlock = () => {
      clearScrollLockTimers();
      observerLock.current = false;
    };

    const scheduleQuietUnlock = () => {
      if (quietTimeout != null) window.clearTimeout(quietTimeout);
      quietTimeout = window.setTimeout(() => {
        if (Math.abs(window.scrollY - lastScrollY) < 1) unlock();
        else scheduleQuietUnlock();
      }, 140);
    };

    const onScroll = () => {
      sawScroll = true;
      lastScrollY = window.scrollY;
      scheduleQuietUnlock();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Instant jumps may emit no scroll events; unlock shortly if none arrive.
    quietTimeout = window.setTimeout(() => {
      if (!sawScroll) unlock();
    }, 160);
    unlockObserverTimeout.current = window.setTimeout(unlock, maxWaitMs);

    scrollSettleCleanup.current = () => {
      window.removeEventListener('scroll', onScroll);
      if (quietTimeout != null) window.clearTimeout(quietTimeout);
    };
  }, [clearScrollLockTimers]);

  useEffect(() => () => clearScrollLockTimers(), [clearScrollLockTimers]);

  const goToIndex = useCallback((nextIndex, behavior = 'smooth') => {
    const bounded = Math.max(0, Math.min(nextIndex, events.length - 1));
    setCurrentEventIndex(bounded);
    if (!isMobile) {
      const preferInstant = reduceMotion || behavior === 'instant';
      const scrollBehavior = preferInstant ? 'auto' : behavior;
      const target = storyStepRefs.current.get(events[bounded].id);
      lockObserverUntilScrollSettles(preferInstant ? 900 : 1200);

      if (!target) return;

      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      // CSS `scroll-behavior: smooth` can animate even when scrollIntoView asks for "auto".
      if (preferInstant) root.style.scrollBehavior = 'auto';

      target.scrollIntoView({
        behavior: scrollBehavior,
        block: 'center',
      });

      if (preferInstant) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            root.style.scrollBehavior = previousScrollBehavior;
          });
        });
      }
    }
  }, [events, isMobile, lockObserverUntilScrollSettles, reduceMotion]);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const handleChange = event => setIsMobile(event.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!navigationRequest) return undefined;
    if (handledNavigationKey.current === navigationRequest.key) return undefined;

    handledNavigationKey.current = navigationRequest.key;
    if (navigationRequest.eventId == null) return undefined;

    const index = events.findIndex(event => event.id === navigationRequest.eventId);
    if (index === -1) return undefined;

    const frame = window.requestAnimationFrame(() => goToIndex(index, 'instant'));
    return () => window.cancelAnimationFrame(frame);
  }, [events, goToIndex, navigationRequest]);

  useEffect(() => {
    onEventChange?.(currentEvent.id);
  }, [currentEvent.id, onEventChange]);

  useEffect(() => {
    if (isMobile) return undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (observerLock.current) return;
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number(visible.target.dataset.eventIndex);
        if (Number.isFinite(index)) {
          setCurrentEventIndex(index);
          setIsPlaying(false);
        }
      },
      { rootMargin: '-30% 0px -30% 0px', threshold: [0.25, 0.5, 0.75] },
    );

    storyStepRefs.current.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [isMobile]);

  useEffect(() => {
    if (!effectivelyPlaying) return undefined;
    const timer = window.setTimeout(() => {
      const nextIndex = currentEventIndex + 1;
      goToIndex(nextIndex);
      if (nextIndex >= events.length - 1) setIsPlaying(false);
    }, playSpeed);
    return () => window.clearTimeout(timer);
  }, [currentEventIndex, effectivelyPlaying, events.length, goToIndex, playSpeed]);

  const togglePlayback = useCallback(() => {
    if (effectivelyPlaying) {
      setIsPlaying(false);
      return;
    }
    if (atLastEvent) {
      goToIndex(0, 'instant');
    }
    setIsPlaying(true);
  }, [atLastEvent, effectivelyPlaying, goToIndex]);

  useEffect(() => {
    const handleKeyDown = event => {
      if (keyboardShortcutsOpen) return;
      if (event.target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]')) return;
      if (event.key === ' ') {
        event.preventDefault();
        togglePlayback();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        setIsPlaying(false);
        goToIndex(currentEventIndex + 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsPlaying(false);
        goToIndex(currentEventIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentEventIndex, goToIndex, keyboardShortcutsOpen, togglePlayback]);

  const toggleFilter = useCallback(type => {
    setActiveFilters(current => {
      const next = new Set(current);
      if (next.has(type) && next.size > 1) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const cycleSpeed = useCallback(() => {
    setPlaySpeed(current => {
      const index = SPEED_PRESETS.findIndex(preset => preset.ms === current);
      return SPEED_PRESETS[(index + 1) % SPEED_PRESETS.length].ms;
    });
  }, []);

  const handleEventSelect = useCallback(eventId => {
    const index = events.findIndex(event => event.id === eventId);
    if (index !== -1) {
      setIsPlaying(false);
      const behavior = Math.abs(index - currentEventIndex) > 1 ? 'instant' : 'smooth';
      goToIndex(index, behavior);
    }
  }, [currentEventIndex, events, goToIndex]);

  const playbackLabel = effectivelyPlaying ? 'Pause' : atLastEvent ? 'Replay' : 'Play';

  const controlsContent = (
    <>
      <button
        className={`explore-btn primary ${effectivelyPlaying ? 'active' : ''}`}
        onClick={togglePlayback}
        aria-pressed={effectivelyPlaying}
      >
        {effectivelyPlaying ? (
          <><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3v10M11 3v10" /></svg>Pause</>
        ) : (
          <><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 3 8 5-8 5z" /></svg>{playbackLabel}</>
        )}
      </button>
      <button className="speed-indicator" onClick={cycleSpeed} aria-label="Change playback speed">
        {SPEED_PRESETS.find(preset => preset.ms === playSpeed)?.label}
      </button>
      <span className="controls-divider" aria-hidden="true" />
      <button
        className={`explore-btn ${timelineOpen ? 'active' : ''}`}
        onClick={() => setTimelineOpen(current => !current)}
        aria-expanded={timelineOpen}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M4 5v6M8 4v8M12 6v4" /></svg>
        Timeline
      </button>
      <button
        className={`explore-btn ${filtersOpen ? 'active' : ''}`}
        onClick={() => setFiltersOpen(current => !current)}
        aria-expanded={filtersOpen}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4l-3 1V8z" /></svg>
        Layers
      </button>
      <SearchBar events={events} onEventSelect={handleEventSelect} darkMode={darkMode} />
    </>
  );

  const mapStage = (
    <>
      <EventMap
        events={filteredEvents}
        colonyBoundaries={colonyBoundaries}
        activeEventId={currentEvent.id}
        onEventClick={handleEventSelect}
        showColonies
        fillColonies={fillColonies}
        darkMode={darkMode}
        hideFutureEvents={false}
        scrollWheelZoom={false}
        compactLayout={isMobile}
      />
      <div className="map-reading">
        <span className="map-reading-kicker">Chapter {activeChapter.number}</span>
        <strong>{activeChapter.title}</strong>
        <span>{activeChapter.years}</span>
      </div>
      <div className="explore-status" aria-label={`Event ${currentEventIndex + 1} of ${events.length}`}>
        <span>{String(currentEventIndex + 1).padStart(2, '0')}</span>
        <div className="status-track"><Motion.div animate={{ width: `${progress}%` }} /></div>
        <span>{events.length}</span>
      </div>
      <div className="map-source">Map: Esri shaded relief · Event locations approximate</div>
    </>
  );

  const filterPanel = (
    <AnimatePresence>
      {filtersOpen && (
        <Motion.div
          className="filters-panel"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          <div className="filters-panel-heading">
            <p className="editorial-kicker">Map layers</p>
            <span>Choose which events remain visible.</span>
          </div>
          <FilterBar activeFilters={activeFilters} onToggle={toggleFilter} />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={fillColonies}
              onChange={() => setFillColonies(current => !current)}
            />
            Shade colonial boundaries
          </label>
        </Motion.div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <section className={`scrollytelling-view mobile-story ${darkMode ? 'dark' : ''}`} aria-label="Interactive story">
        <div className="mobile-map-stage">{mapStage}</div>
        {filterPanel}
        <MobileBottomSheet
          eventId={currentEvent.id}
          darkMode={darkMode}
          controlsContent={controlsContent}
          timelineOpen={timelineOpen}
        >
          {timelineOpen && (
            <HorizontalTimeline
              events={events}
              activeEventId={currentEvent.id}
              onEventClick={handleEventSelect}
              darkMode={darkMode}
            />
          )}
          <EventCard
            event={currentEvent}
            darkMode={darkMode}
            chapter={activeChapter}
            eventNumber={currentEventIndex + 1}
            totalEvents={events.length}
            onPrev={() => goToIndex(currentEventIndex - 1)}
            onNext={() => goToIndex(currentEventIndex + 1)}
            hasPrev={currentEventIndex > 0}
            hasNext={currentEventIndex < events.length - 1}
          />
        </MobileBottomSheet>
      </section>
    );
  }

  return (
    <section className={`scrollytelling-view desktop-story ${darkMode ? 'dark' : ''}`} aria-label="Interactive story">
      <div className="story-layout">
        <aside className="story-map-column" aria-label="Interactive event map">
          <div className="story-map-sticky">
            {mapStage}
            <div className="explore-controls">{controlsContent}</div>
            {filterPanel}
            <AnimatePresence>
              {timelineOpen && (
                <Motion.div
                  className="explore-timeline-container"
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                >
                  <HorizontalTimeline
                    events={events}
                    activeEventId={currentEvent.id}
                    onEventClick={handleEventSelect}
                    darkMode={darkMode}
                  />
                </Motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        <article className="story-rail">
          <header className="story-introduction">
            <p className="editorial-kicker">The chronology</p>
            <h1>Ten years that remade the Atlantic world</h1>
            <p>
              Move through five chapters. The map follows each political rupture,
              battlefield reversal, and final act of restraint.
            </p>
            <div className="story-instructions">
              <span>Scroll to read</span>
              <span aria-hidden="true">↓</span>
            </div>
          </header>

          {chapters.map(chapter => {
            const chapterEvents = events.filter(
              event => event.id >= chapter.startId && event.id <= chapter.endId,
            );
            return (
              <section className="story-chapter" key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
                <header className="chapter-header">
                  <span className="chapter-number">{chapter.number}</span>
                  <p className="editorial-kicker">{chapter.years}</p>
                  <h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2>
                  <p>{chapter.summary}</p>
                </header>
                {chapterEvents.map(event => {
                  const index = events.findIndex(item => item.id === event.id);
                  return (
                    <div
                      className={`story-step ${currentEvent.id === event.id ? 'active' : ''}`}
                      key={event.id}
                      data-event-index={index}
                      ref={node => {
                        if (node) storyStepRefs.current.set(event.id, node);
                        else storyStepRefs.current.delete(event.id);
                      }}
                    >
                      <EventCard
                        event={event}
                        darkMode={darkMode}
                        chapter={chapter}
                        eventNumber={index + 1}
                        totalEvents={events.length}
                        isActive={currentEvent.id === event.id}
                      />
                    </div>
                  );
                })}
              </section>
            );
          })}

          <footer className="story-end">
            <p className="editorial-kicker">The republic begins</p>
            <h2>The war ends. The experiment does not.</h2>
            <p>
              Independence settled sovereignty, but left the new nation to define
              citizenship, representation, and the reach of its founding promises.
            </p>
            <button className="text-link-button" onClick={onExitToWelcome}>Return to the introduction</button>
          </footer>
        </article>
      </div>
    </section>
  );
}
