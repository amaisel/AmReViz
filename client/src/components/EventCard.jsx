import { motion as Motion, AnimatePresence } from 'framer-motion';
import useEventImage from '../hooks/useEventImage';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
};

export default function EventCard({ event, darkMode, timelineOpen, onPrev, onNext, hasPrev, hasNext }) {
  const { src: imageSrc, credit: imageCredit } = useEventImage(event);
  if (!event) return null;

  const formattedDate = formatDate(event.date);
  const formattedEndDate = event.endDate ? formatDate(event.endDate) : null;

  // White-on-gold fails WCAG AA (diplomatic measured at 2.49:1 light / 1.77:1
  // dark). Keep the parchment gold and put dark ink on it instead. Military was
  // a hair under 4.5:1; darken the green so white text clears the bar.
  const typeColors = {
    battle: { bg: darkMode ? '#A33030' : '#7A1212', fg: '#ffffff' },
    political: { bg: darkMode ? '#2C4B7A' : '#0A244A', fg: '#ffffff' },
    diplomatic: { bg: darkMode ? '#E0C060' : '#C5A02F', fg: '#1A1408' },
    military: { bg: darkMode ? '#1F6F46' : '#1B7A1B', fg: '#ffffff' },
  };

  const typeLabels = {
    battle: 'Battle',
    political: 'Political',
    diplomatic: 'Diplomatic',
    military: 'Military'
  };

  const outcomeLabels = {
    american: 'American victory',
    british: 'British victory',
    indecisive: 'Inconclusive',
    allied: 'Allied victory'
  };

  const outcomeColors = {
    american: { bg: darkMode ? '#2C4B7A' : '#0A244A', fg: '#ffffff' },
    british: { bg: darkMode ? '#A33030' : '#7A1212', fg: '#ffffff' },
    indecisive: { bg: darkMode ? '#E0C060' : '#C5A02F', fg: '#1A1408' },
    allied: { bg: '#1F6F46', fg: '#ffffff' },
  };

  const americanLabel = event.combatants?.american || 'American / allied';
  const britishLabel = event.combatants?.british || 'Crown / allied';

  return (
    <AnimatePresence mode="wait">
      <Motion.div
        className={`event-card-fixed ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-open' : ''}`}
        initial={{ opacity: 0, rotateY: -8, x: 30, scale: 0.95 }}
        animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, rotateY: 8, x: -20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
        key={event.id}
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
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
            style={{
              backgroundColor: typeColors[event.type].bg,
              color: typeColors[event.type].fg,
            }}
          >
            {typeLabels[event.type]}
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
                style={{
                  backgroundColor: outcomeColors[event.outcome].bg,
                  color: outcomeColors[event.outcome].fg,
                }}
              >
                {event.outcomeLabel || outcomeLabels[event.outcome]}
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
