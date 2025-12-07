import { useRef, useEffect, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

function TimelineEvent({ event, isActive, onClick, index, darkMode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    margin: "-35% 0px -35% 0px",
    once: false
  });

  const typeColors = {
    battle: darkMode ? '#dc2626' : '#8b2323',
    political: darkMode ? '#2563eb' : '#1e3a5f',
    diplomatic: darkMode ? '#059669' : '#2d5a27'
  };

  const typeLabels = {
    battle: 'BATTLE',
    political: 'POLITICAL',
    diplomatic: 'DIPLOMATIC'
  };

  return (
    <motion.div
      ref={ref}
      className={`timeline-event ${isActive ? 'active' : ''}`}
      initial={{ opacity: 0.5, x: -10 }}
      animate={{ 
        opacity: isInView ? 1 : 0.4,
        x: 0,
        scale: isActive ? 1.01 : 1
      }}
      transition={{ duration: 0.4 }}
      onClick={() => onClick(event.id)}
    >
      <div className="event-date">
        <span className="year">{event.year}</span>
        <span className="full-date">
          {new Date(event.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
      </div>
      
      <div className="event-line">
        <motion.div 
          className="event-dot"
          style={{ 
            backgroundColor: typeColors[event.type],
            borderColor: typeColors[event.type]
          }}
          animate={{
            scale: isActive ? 1.4 : 1,
            boxShadow: isActive 
              ? `0 0 15px ${typeColors[event.type]}` 
              : 'none'
          }}
        />
        <div className="event-connector" />
      </div>
      
      <div className="event-content">
        <span 
          className="event-type"
          style={{ color: typeColors[event.type] }}
        >
          {typeLabels[event.type]}
        </span>
        <h3 className="event-title">{event.title}</h3>
        <p className="event-location">{event.location}</p>
        
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="event-details"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="event-description">{event.description}</p>
              <div className="event-significance">
                <strong>Significance:</strong> {event.significance}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Timeline({ events, activeEventId, onEventClick, darkMode }) {
  return (
    <div className={`timeline ${darkMode ? 'dark' : 'light'}`}>
      <div className="timeline-header">
        <h2>The Road to Independence</h2>
        <p>1773 - 1783</p>
      </div>
      
      <div className="timeline-events">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isActive={event.id === activeEventId}
            onClick={onEventClick}
            index={index}
            darkMode={darkMode}
          />
        ))}
      </div>
      
      <div className="timeline-footer">
        <p>Click events to explore the American Revolution</p>
      </div>
    </div>
  );
}
