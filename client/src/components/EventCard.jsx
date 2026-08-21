import { motion as Motion, AnimatePresence } from 'framer-motion';
import useEventImage from '../hooks/useEventImage';
import { typeTheme, typeLabel, outcomeTheme, outcomeLabel } from '../constants/palette';
import useReducedMotion from '../hooks/useReducedMotion';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

export default function EventCard({ event, darkMode, timelineOpen, onPrev, onNext, hasPrev, hasNext }) {
  const { src: imageSrc, credit: imageCredit } = useEventImage(event);
  const reduceMotion = useReducedMotion();
  if (!event) return null;

  const formattedDate = formatDate(event.date);
  const formattedEndDate = event.endDate ? formatDate(event.endDate) : null;

  // Both pairings carry a foreground as well as a background: white on the
  // gold and on the green failed WCAG AA, and the fix lives in the palette
  // rather than in a per-component override.
  const badge = typeTheme(event.type, darkMode);
  const outcome = outcomeTheme(event.outcome, darkMode);

  const americanLabel = event.combatants?.american || 'American / allied';
  const britishLabel = event.combatants?.british || 'Crown / allied';

  return (
    <AnimatePresence mode="wait">
      <Motion.div
        className={`event-card-fixed ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-open' : ''}`}
        // Reduced motion keeps the crossfade — it marks that the card changed —
        // and drops the 3D swing and the slide, which are the parts that
        // provoke vestibular symptoms.
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: -8, x: 30, scale: 0.95 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, rotateY: 0, x: 0, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotateY: 8, x: -20, scale: 0.95 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
        key={event.id}
        style={reduceMotion ? undefined : { perspective: 1000, transformStyle: 'preserve-3d' }}
      >
        {imageSrc && (
          <div className="event-card-image">
            <img src={imageSrc} alt={event.title} loading="lazy" />
            {imageCredit && (
              <a
                className="event-card-image-credit"
                href={imageCredit}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Wikipedia
              </a>
            )}
          </div>
        )}

        <div className="event-card-topline">
          <div
            className="event-card-type-badge"
            style={{ backgroundColor: badge.bg, color: badge.fg }}
          >
            {typeLabel(event.type)}
          </div>
          <span className="event-card-date-inline">
            {formattedDate}
            {formattedEndDate && ` – ${formattedEndDate}`}
          </span>
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

        {(event.outcome || event.campaign) && (
          <div className="event-card-battle-meta">
            {event.outcome && (
              <span
                className="event-card-outcome"
                style={{ backgroundColor: outcome?.bg, color: outcome?.fg }}
              >
                {event.outcomeLabel || outcomeLabel(event.outcome)}
              </span>
            )}
            {event.campaign && (
              <span className="event-card-campaign">{event.campaign} campaign</span>
            )}
          </div>
        )}

        {event.forces && event.casualties && (
          <div
            className="event-card-stats-table"
            role="table"
            aria-label={`Estimated forces and casualties at ${event.title}`}
          >
            <div className="event-card-stats-row event-card-stats-head" role="row">
              <span role="columnheader">Estimate</span>
              <span role="columnheader">{americanLabel}</span>
              <span role="columnheader">{britishLabel}</span>
            </div>
            <div className="event-card-stats-row" role="row">
              <strong role="rowheader">Forces</strong>
              <span role="cell">{event.forces.american.toLocaleString()}</span>
              <span role="cell">{event.forces.british.toLocaleString()}</span>
            </div>
            <div className="event-card-stats-row" role="row">
              <strong role="rowheader">Casualties</strong>
              <span role="cell">{event.casualties.american.toLocaleString()}</span>
              <span role="cell">{event.casualties.british.toLocaleString()}</span>
            </div>
          </div>
        )}

        {event.facts?.length > 0 && (
          <div className="event-card-facts" aria-label="Key figures">
            {event.facts.map((fact) => (
              <div className="event-card-fact" key={`${fact.label}-${fact.value}`}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </div>
            ))}
          </div>
        )}

        {event.statNote && (
          <p className="event-card-stat-note">
            <strong>Reading the numbers:</strong> {event.statNote}
          </p>
        )}

        <div className="event-card-significance">
          <strong>Why This Matters</strong>
          <p>{event.significance}</p>
        </div>

        {event.source && (
          <a
            className="event-card-source"
            href={event.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Source: {event.source.label}
            <span aria-hidden="true"> ↗</span>
          </a>
        )}

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
      </Motion.div>
    </AnimatePresence>
  );
}
