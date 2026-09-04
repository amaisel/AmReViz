import { useEffect, useRef } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { events } from '../data/events';

const eventRange = {
  start: events[0]?.year,
  end: events[events.length - 1]?.year,
};

const KEY_STATS = [
  { value: String(events.length), label: 'Source-linked events' },
  {
    value: String(events.filter(event => event.type === 'battle').length),
    label: 'Battles & sieges',
  },
  { value: '13', label: 'Colonies' },
];

export default function WelcomeScreen({
  onBegin,
  onOpenData,
  darkMode,
  onToggleDarkMode,
}) {
  const scrollThreshold = useRef(0);
  const hasTriggered = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleWheel = (event) => {
      if (hasTriggered.current) return;

      if (event.deltaY > 0) {
        scrollThreshold.current += event.deltaY;
        if (scrollThreshold.current > 110) {
          hasTriggered.current = true;
          onBegin();
        }
      } else {
        scrollThreshold.current = Math.max(0, scrollThreshold.current + event.deltaY);
      }
    };

    const handleKeyDown = (event) => {
      const target = event.target;
      const isInteractive = target instanceof Element
        && target.closest('button, a, input, textarea, select, [contenteditable="true"]');

      if (hasTriggered.current || isInteractive) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

      // ArrowRight matches how the story itself now advances; ArrowDown stays
      // because there is no card to scroll on this screen and it reads as
      // "onward" to anyone who arrived by scrolling.
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
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

  const openShortcuts = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?' }));
  };

  const reveal = reduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <Motion.section
      className={`welcome-screen ${darkMode ? 'dark' : ''}`}
      aria-labelledby="welcome-title"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <div className="welcome-atlas-frame" aria-hidden="true" />

      <header className="welcome-atlas-masthead">
        <p className="welcome-atlas-eyebrow">
          <span aria-hidden="true" />
          {eventRange.start} — {eventRange.end} · An interactive history
        </p>

        <button
          className="welcome-atlas-theme"
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={darkMode}
        >
          <span className={!darkMode ? 'active' : ''} aria-hidden="true">☀</span>
          <span className={darkMode ? 'active' : ''} aria-hidden="true">◐</span>
        </button>
      </header>

      <div className="welcome-atlas-layout">
        <Motion.div className="welcome-atlas-hero" {...reveal}>
          <h1 className="welcome-title" id="welcome-title">
            The American
            <span>Revolution</span>
          </h1>

          <div className="welcome-atlas-rule" aria-hidden="true">
            <span />
            <span />
          </div>

          <p className="welcome-atlas-description">
            Follow the Revolution from coordinated resistance to international war and
            negotiated peace.
          </p>

          <div className="welcome-atlas-actions">
            <button
              className="welcome-atlas-action primary"
              type="button"
              onClick={onBegin}
            >
              <span>Begin exploring</span>
              <span aria-hidden="true">→</span>
            </button>
            <button
              className="welcome-atlas-action secondary"
              type="button"
              onClick={onOpenData}
            >
              Open the data
            </button>
          </div>
        </Motion.div>

        <div className="welcome-atlas-map" aria-hidden="true">
          <div className="welcome-atlas-coast" />
          <div className="welcome-atlas-orbit orbit-one" />
          <div className="welcome-atlas-orbit orbit-two" />
          <div className="welcome-atlas-route">
            <span className="route-segment segment-one" />
            <span className="route-segment segment-two" />
            <span className="route-segment segment-three" />
            <span className="route-segment segment-four" />
            <span className="route-point point-one" />
            <span className="route-point point-two" />
            <span className="route-point point-three" />
            <span className="route-point point-four" />
            <span className="route-point point-five" />
          </div>
          <div className="welcome-atlas-compass">
            <span>N</span>
            <i />
          </div>
        </div>

        {/* A div, not an <aside>. A complementary landmark nested inside the
            section landmark above it is reported by assistive tech as
            misplaced, and this is a stat list rather than an aside from the
            page's main content — the heading below names it either way. */}
        <Motion.div
          className="welcome-atlas-legend"
          role="group"
          aria-label="Project overview"
          initial={reduceMotion ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.65, delay: 0.18 }}
        >
          {KEY_STATS.map((stat) => (
            <div className="welcome-atlas-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </Motion.div>
      </div>

      <footer className="welcome-atlas-footer">
        <p>
          <span aria-hidden="true">◇</span>
          Mapped chronology · sourced estimates · keyboard accessible
        </p>
        <button type="button" onClick={openShortcuts} className="welcome-atlas-help">
          <span aria-hidden="true">?</span>
          Shortcuts
        </button>
      </footer>
    </Motion.section>
  );
}
