import { motion, AnimatePresence } from 'framer-motion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function EventCard({ event, darkMode, timelineOpen, onPrev, onNext, hasPrev, hasNext }) {
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
        <div className="event-card-topline">
          <div
            className="event-card-type-badge"
            style={{ backgroundColor: typeColors[event.type] }}
          >
            {typeLabels[event.type]}
          </div>
          <span className="event-card-date-inline">{formattedDate}</span>
        </div>

        <h2 className="event-card-title">{event.title}</h2>

        <div className="event-card-location-row">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="7" r="2.5"/>
            <path d="M8 14s5-4.5 5-7a5 5 0 1 0-10 0c0 2.5 5 7 5 7z"/>
          </svg>
          <span className="event-card-location">
            {event.location.split('\n').map((line, i) => (
              <span key={i}>{line}{i < event.location.split('\n').length - 1 && ', '}</span>
            ))}
          </span>
        </div>

        <p className="event-card-description">{event.description}</p>

        <div className="event-card-significance">
          <strong>Why This Matters</strong>
          <p>{event.significance}</p>
        </div>

        {(onPrev || onNext) && (
          <div className="event-card-nav">
            <button
              className="event-card-nav-btn"
              onClick={onPrev}
              disabled={!hasPrev}
              aria-label="Previous event"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="10 12 6 8 10 4"/>
              </svg>
              Prev
            </button>
            <button
              className="event-card-nav-btn"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Next event"
            >
              Next
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 4 10 8 6 12"/>
              </svg>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
