import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './Map';
import EventCard from './EventCard';

export default function ScrollytellingView({ 
  events, 
  colonyBoundaries, 
  darkMode,
  onExitToWelcome 
}) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [fillColonies, setFillColonies] = useState(false);
  const scrollContainerRef = useRef(null);
  const eventSectionsRef = useRef([]);
  const isScrolling = useRef(false);
  const accumulatedDelta = useRef(0);
  
  const currentEvent = events[currentEventIndex];
  const currentYear = currentEvent?.year || 1773;
  
  // Events visible up to current point in time
  const visibleEvents = events.slice(0, currentEventIndex + 1);
  
  // Handle wheel events - accumulate delta to require intentional scrolling
  useEffect(() => {
    const SCROLL_THRESHOLD = 80; // Pixels of scroll needed to change event
    
    const handleWheel = (e) => {
      if (isPaused || isScrolling.current) return;
      
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
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [events.length, isPaused]);
  
  // Scroll to specific event
  const scrollToEvent = useCallback((index) => {
    const container = scrollContainerRef.current;
    if (container) {
      const sectionHeight = window.innerHeight * 0.8;
      container.scrollTo({
        top: index * sectionHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [events.length]);
  
  // Handle pause mode toggle
  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setShowAllEvents(false);
    }
  };
  
  // Progress percentage
  const progress = ((currentEventIndex + 1) / events.length) * 100;
  
  return (
    <div className={`scrollytelling-view ${darkMode ? 'dark' : ''}`}>
      {/* Fixed Map Layer */}
      <div className="scrolly-map-container">
        <Map
          events={isPaused && showAllEvents ? events : visibleEvents}
          colonyBoundaries={colonyBoundaries}
          activeEventId={currentEvent?.id}
          onEventClick={(id) => {
            const idx = events.findIndex(e => e.id === id);
            if (idx !== -1) {
              setCurrentEventIndex(idx);
              scrollToEvent(idx);
            }
          }}
          showColonies={true}
          fillColonies={fillColonies}
          darkMode={darkMode}
          hideFutureEvents={false}
        />
      </div>
      
      {/* Year Counter - Fixed */}
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
      
      {/* Progress Bar */}
      <div className="scrolly-progress">
        <div className="progress-track">
          <motion.div 
            className="progress-fill"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
      
      {/* Pause/Map View Toggle */}
      <div className="scrolly-controls">
        <button 
          className={`pause-btn ${isPaused ? 'active' : ''}`}
          onClick={togglePause}
        >
          {isPaused ? 'Resume Story' : 'Pause & Explore'}
        </button>
        
        <label className="checkbox-label">
          <input 
            type="checkbox"
            checked={fillColonies}
            onChange={() => setFillColonies(!fillColonies)}
          />
          Color colonies
        </label>
        
        {isPaused && (
          <motion.div 
            className="pause-options"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <label className="checkbox-label">
              <input 
                type="checkbox"
                checked={showAllEvents}
                onChange={() => setShowAllEvents(!showAllEvents)}
              />
              Show all events on map
            </label>
          </motion.div>
        )}
      </div>
      
      {/* Event Card - Fixed */}
      <AnimatePresence mode="wait">
        <EventCard event={currentEvent} darkMode={darkMode} />
      </AnimatePresence>
      
      {/* Scrollable Story Sections */}
      <div 
        className="scrolly-sections"
        ref={scrollContainerRef}
      >
        {events.map((event, index) => (
          <div 
            key={event.id}
            ref={el => eventSectionsRef.current[index] = el}
            className={`story-section ${index === currentEventIndex ? 'active' : ''}`}
          >
            {/* Invisible scroll trigger zones */}
          </div>
        ))}
        {/* Extra space at end for last event */}
        <div className="story-section-end" />
      </div>
      
            
      {/* Navigation Hints */}
      {currentEventIndex === 0 && (
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
      
      {currentEventIndex === events.length - 1 && (
        <motion.div 
          className="story-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>End of Timeline</p>
          <div className="story-end-actions">
            <button onClick={onExitToWelcome}>Start Over</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
