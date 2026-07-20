import { motion, useReducedMotion } from 'framer-motion';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const typeLabels = {
  battle: 'Battle',
  political: 'Political',
  military: 'Military',
};

export default function EventCard({
  event,
  darkMode,
  chapter,
  eventNumber,
  totalEvents,
  isActive = true,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) {
  const reduceMotion = useReducedMotion();
  if (!event) return null;

  const date = new Date(event.date);
  const formattedDate = `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  const casualtyTotal = event.casualties
    ? event.casualties.american + event.casualties.british
    : null;

  return (
    <motion.article
      className={`event-card-fixed ${darkMode ? 'dark' : ''} ${isActive ? 'active' : ''}`}
      initial={reduceMotion ? false : { opacity: 0.72, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.4, once: false }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${event.title}, ${formattedDate}`}
    >
      <div className="event-card-furniture">
        <span className={`event-card-type-badge type-${event.type}`}>{typeLabels[event.type]}</span>
        <span>{chapter?.title}</span>
        <span>{String(eventNumber).padStart(2, '0')} / {totalEvents}</span>
      </div>

      <time className="event-card-date-inline" dateTime={event.date}>{formattedDate}</time>
      <h3 className="event-card-title">{event.title}</h3>

      <div className="event-card-location-row">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="8" cy="6.5" r="2.25" />
          <path d="M8 14s4.5-4.1 4.5-7.5a4.5 4.5 0 1 0-9 0C3.5 9.9 8 14 8 14Z" />
        </svg>
        <span>{event.location.replace('\n', ', ')}</span>
      </div>

      {event.casualties && (
        <dl className="event-card-figures" aria-label="Battle summary">
          <div>
            <dt>Forces engaged</dt>
            <dd>{(event.forces.american + event.forces.british).toLocaleString()}</dd>
          </div>
          <div>
            <dt>Casualties</dt>
            <dd>{casualtyTotal.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Outcome</dt>
            <dd>{event.outcome === 'indecisive' ? 'Indecisive' : `${event.outcome === 'american' ? 'American' : 'British'} victory`}</dd>
          </div>
        </dl>
      )}

      <p className="event-card-description">{event.description}</p>

      <aside className="event-card-significance">
        <span>Why it matters</span>
        <p>{event.significance}</p>
      </aside>

      <p className="event-card-source">
        Sources: National Park Service; American Battlefield Trust for battle estimates.
      </p>

      {(onPrev || onNext) && (
        <nav className="event-card-nav" aria-label="Event navigation">
          <button
            className="event-card-nav-btn"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous event"
          >
            <span aria-hidden="true">←</span> Previous
          </button>
          <button
            className="event-card-nav-btn"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next event"
          >
            Next <span aria-hidden="true">→</span>
          </button>
        </nav>
      )}
    </motion.article>
  );
}
