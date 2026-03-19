import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function EventCard({ event, darkMode, timelineOpen }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [event?.id]);

  if (!event) return null;

  const date = new Date(event.date);
  const formattedDate = `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

  const typeColors = {
    battle: darkMode ? '#A33030' : '#7A1212',
    political: darkMode ? '#2C4B7A' : '#0A244A',
    diplomatic: darkMode ? '#E0C060' : '#C5A02F',
    military: darkMode ? '#2E8B57' : '#228B22'
  };

  const typeLabels = {
    battle: 'Battle',
    political: 'Political',
    diplomatic: 'Diplomatic',
    military: 'Military'
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`event-card-fixed ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-open' : ''}`}
        initial={{ opacity: 0, rotateY: -8, x: 30, scale: 0.95 }}
        animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, rotateY: 8, x: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
        key={event.id}
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
      >
        <div
          className="event-card-type-badge"
          style={{ backgroundColor: typeColors[event.type] }}
        >
          {typeLabels[event.type]}
        </div>

        <h2 className="event-card-title">{event.title}</h2>

        <div className="event-card-meta">
          <span className="event-card-date">{formattedDate}</span>
          <span className="event-card-location">
            {event.location.split('\n').map((line, i) => (
              <span key={i}>{line}{i < event.location.split('\n').length - 1 && <br />}</span>
            ))}
          </span>
        </div>

        <p className={`event-card-description ${expanded ? 'expanded' : ''}`}>{event.description}</p>
        {!expanded && (
          <button className="event-card-read-more" onClick={() => setExpanded(true)}>
            Read more
          </button>
        )}

        <div className="event-card-significance">
          <strong>Historical Significance</strong>
          <p>{event.significance}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
