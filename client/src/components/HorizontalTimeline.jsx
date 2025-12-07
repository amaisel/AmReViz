import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HorizontalTimeline({ events, activeEventId, onEventClick, darkMode }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  const typeColors = {
    battle: darkMode ? '#dc2626' : '#8b2323',
    political: darkMode ? '#2563eb' : '#1e3a5f',
    diplomatic: darkMode ? '#059669' : '#2d5a27'
  };

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;
      const containerWidth = container.offsetWidth;
      const activeLeft = activeEl.offsetLeft;
      const activeWidth = activeEl.offsetWidth;
      
      container.scrollTo({
        left: activeLeft - (containerWidth / 2) + (activeWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [activeEventId]);

  const getMonth = (dateStr) => {
    const date = new Date(dateStr);
    return monthNames[date.getMonth()];
  };

  return (
    <div className={`horizontal-timeline ${darkMode ? 'dark' : 'light'}`}>
      <div className="timeline-track" ref={scrollRef}>
        <div className="timeline-line" />
        
        <div className="timeline-events-row">
          {events.map((event) => {
            const isActive = event.id === activeEventId;
            
            return (
              <motion.div
                key={event.id}
                ref={isActive ? activeRef : null}
                className={`h-timeline-event ${isActive ? 'active' : ''}`}
                onClick={() => onEventClick(event.id)}
                whileHover={{ scale: 1.02 }}
                animate={{ 
                  opacity: isActive ? 1 : 0.7
                }}
              >
                <motion.div 
                  className="h-event-dot"
                  style={{ 
                    backgroundColor: isActive ? typeColors[event.type] : 'transparent',
                    borderColor: typeColors[event.type]
                  }}
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    boxShadow: isActive 
                      ? `0 0 12px ${typeColors[event.type]}` 
                      : 'none'
                  }}
                />
                
                <div className="h-event-content">
                  <span className="h-event-year">{event.year}</span>
                  <span className="h-event-month">{getMonth(event.date)}</span>
                  <span className="h-event-title">{event.title}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      <div className="timeline-nav">
        <span className="nav-year">1773</span>
        <div className="nav-arrow">Time</div>
        <span className="nav-year">1783</span>
      </div>
    </div>
  );
}
