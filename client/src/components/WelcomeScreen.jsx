import { useEffect, useRef } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';

const KEY_STATS = [
  { value: '18', label: 'defining events' },
  { value: '7', label: 'major battles' },
  { value: '13', label: 'colonies' },
  { value: '10', label: 'years of change' },
];

const TURNING_POINTS = [
  { year: '1773', title: 'Resistance', detail: 'Tea destroyed in Boston Harbor' },
  { year: '1776', title: 'Independence', detail: 'A new nation declared' },
  { year: '1777', title: 'Alliance', detail: 'Saratoga changes the war' },
  { year: '1781', title: 'Victory', detail: 'Cornwallis surrenders at Yorktown' },
  { year: '1783', title: 'Republic', detail: 'Civilian authority takes hold' },
];

export default function WelcomeScreen({ onBegin, onOpenData, darkMode }) {
  const hasTriggered = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleWheel = (event) => {
      if (hasTriggered.current || event.deltaY < 60) return;
      hasTriggered.current = true;
      onBegin();
    };

    const handleKeyDown = (event) => {
      if (hasTriggered.current || event.target.closest('button, a, input, select, textarea')) return;
      if (event.key === 'ArrowDown') {
        hasTriggered.current = true;
        onBegin();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onBegin]);

  return (
    <Motion.section
      className={`welcome-screen ${darkMode ? 'dark' : ''}`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.45 }}
      aria-labelledby="welcome-title"
    >
      <header className="welcome-masthead">
        <span className="welcome-edition">The Independence Issue</span>
        <span className="welcome-wordmark">AMERICAN REVOLUTION</span>
        <span className="welcome-dates">1773—1783</span>
      </header>

      <div className="welcome-layout">
        <div className="welcome-content">
          <p className="editorial-kicker">An interactive historical atlas</p>
          <h1 className="welcome-title" id="welcome-title">
            A revolution,
            <span>mapped.</span>
          </h1>
          <p className="welcome-subtitle">
            Follow the people, battles, political ruptures, and unlikely turns
            that transformed thirteen colonies into an independent republic.
          </p>

          <div className="welcome-actions">
            <button
              className="welcome-begin-btn"
              onClick={onBegin}
              aria-label="Enter Explore mode: begin the interactive story"
            >
              Begin the story
              <span aria-hidden="true">→</span>
            </button>
            <button className="welcome-data-link" onClick={onOpenData}>
              Explore the data
            </button>
          </div>

          <dl className="welcome-stat-strip" aria-label="Story overview">
            {KEY_STATS.map((stat) => (
              <div key={stat.label} className="welcome-stat">
                <dt className="welcome-stat-label">{stat.label}</dt>
                <dd className="welcome-stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <p className="welcome-byline">
            A visual history assembled from National Park Service and American
            Battlefield Trust records.
          </p>
        </div>

        <figure className="welcome-graphic" aria-labelledby="turning-points-title">
          <figcaption>
            <span className="figure-number">FIG. 01</span>
            <span id="turning-points-title">A decade in five turning points</span>
          </figcaption>
          <div className="turning-point-line" aria-hidden="true" />
          <ol className="turning-points">
            {TURNING_POINTS.map((point, index) => (
              <Motion.li
                key={point.year}
                initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + index * 0.08, duration: 0.35 }}
              >
                <span className="turning-point-dot" aria-hidden="true" />
                <time>{point.year}</time>
                <div>
                  <strong>{point.title}</strong>
                  <span>{point.detail}</span>
                </div>
              </Motion.li>
            ))}
          </ol>
          <p className="welcome-graphic-note">
            Scroll, use the arrow keys, or play the chronology to follow all 18 events.
          </p>
        </figure>
      </div>
    </Motion.section>
  );
}
