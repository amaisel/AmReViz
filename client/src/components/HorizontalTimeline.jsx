import { useRef, useEffect } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function HorizontalTimeline({ events, activeEventId, onEventClick, darkMode }) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const typeColors = {
    battle: darkMode ? '#d56a6a' : '#9e2a2b',
    political: darkMode ? '#7fa4ca' : '#163d67',
    military: darkMode ? '#91ad95' : '#4f6b55'
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
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    }
  }, [activeEventId, reduceMotion]);

  const getMonth = (dateStr) => {
    const date = new Date(dateStr);
    return monthNames[date.getUTCMonth()];
  };

  return (
    <div className={`horizontal-timeline ${darkMode ? 'dark' : 'light'}`}>
      <div className="timeline-track" ref={scrollRef}>
        <div className="timeline-line" />

        <div className="timeline-events-row">
          {events.map((event) => {
            const isActive = event.id === activeEventId;

            return (
              <Motion.button
                type="button"
                key={event.id}
                ref={isActive ? activeRef : null}
                className={`h-timeline-event ${isActive ? 'active' : ''}`}
                onClick={() => onEventClick(event.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                  }
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                animate={{
                  opacity: isActive ? 1 : 0.75
                }}
                aria-label={`${event.title} - ${event.year}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div style={{ position: 'relative', height: '24px', display: 'flex', justifyContent: 'center' }}>
                  {isActive && (
                    <Motion.div
                      layoutId="activeEventRing"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      style={{
                        position: 'absolute',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${typeColors[event.type]}`,
                        top: -4,
                        zIndex: 0
                      }}
                    />
                  )}
                  <Motion.div
                    className="h-event-dot"
                    style={{
                      backgroundColor: isActive ? typeColors[event.type] : 'transparent',
                      borderColor: typeColors[event.type],
                      zIndex: 1
                    }}
                    animate={{
                      scale: isActive ? 1 : 0.8,
                    }}
                  />
                </div>

                <div className="h-event-content">
                  <span className="h-event-year">{event.year}</span>
                  <span className="h-event-month">{getMonth(event.date)}</span>
                  <span className="h-event-title">{event.title}</span>
                </div>
              </Motion.button>
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
