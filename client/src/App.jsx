import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import ExploreView from './components/ExploreView';
import { ArmyChart, TradeChart, CasualtiesChart, CampaignTimeline } from './components/Charts';
import BattleComparison from './components/BattleComparison';
import AnimatedCounter from './components/AnimatedCounter';
import { events, armyData, economicData, battleData, campaignData, chapters } from './data/events';
import { colonyBoundaries } from './data/colonyBoundaries';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import useHashRouter from './hooks/useHashRouter';
import './App.css';

function ModeToggle({ darkMode, onToggle }) {
  return (
    <button
      className="icon-button"
      onClick={onToggle}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      {darkMode ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
        </svg>
      )}
    </button>
  );
}

function HelpToggle({ onClick }) {
  return (
    <button
      className="icon-button"
      onClick={onClick}
      aria-label="Show keyboard shortcuts"
      title="Keyboard shortcuts"
    >
      <span aria-hidden="true">?</span>
    </button>
  );
}

function ViewToggle({ view, onViewChange }) {
  return (
    <nav className="view-toggle" aria-label="Primary views">
      {[
        { id: 'explore', label: 'Story' },
        { id: 'data', label: 'Data' },
      ].map((item) => (
        <button
          key={item.id}
          className={view === item.id ? 'active' : ''}
          onClick={() => onViewChange(item.id)}
          aria-current={view === item.id ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function SectionHeading({ id, number, eyebrow, title, children }) {
  return (
    <header className="data-group-header">
      <span className="section-number">{number}</span>
      <div>
        <p className="editorial-kicker">{eyebrow}</p>
        <h3 id={id} className="data-group-title">{title}</h3>
        {children && <p className="data-group-dek">{children}</p>}
      </div>
    </header>
  );
}

function DataView({ darkMode, onNavigateToEvent }) {
  const battles = events.filter(event => event.casualties);

  const handleYearClick = (year) => {
    const match = events.find(event => event.year === year);
    if (match) onNavigateToEvent?.(match.id);
  };

  return (
    <article className="data-view">
      <header className="data-hero">
        <p className="editorial-kicker">The war in numbers</p>
        <h2>How an outmatched rebellion endured</h2>
        <p className="data-subtitle">
          The Revolution was not a steady march toward victory. These graphics show
          an army repeatedly rebuilt, a trade system abruptly severed, and battles
          whose human cost rarely matched their strategic result.
        </p>
        <div className="data-hero-meta">
          <span>5 graphics</span>
          <span>1770–1783</span>
          <span>Updated from cited historical records</span>
        </div>
      </header>

      <dl className="data-insights">
        <div className="insight-card">
          <dt>Peak Continental Army</dt>
          <dd><AnimatedCounter value={35000} className="insight-value" /></dd>
          <p>troops in 1778, after the winter at Valley Forge</p>
        </div>
        <div className="insight-card">
          <dt>British import collapse</dt>
          <dd><AnimatedCounter value={97} suffix="%" className="insight-value" /></dd>
          <p>from the 1771 peak to the Declaration of Independence</p>
        </div>
        <div className="insight-card">
          <dt>Major battles examined</dt>
          <dd><AnimatedCounter value={7} className="insight-value" /></dd>
          <p>with force strength, casualties, and outcomes compared</p>
        </div>
      </dl>

      <section className="data-group" aria-labelledby="forces-title">
        <SectionHeading id="forces-title" number="01" eyebrow="Military capacity" title="An army built and rebuilt">
          Continental strength surged after crisis years, but sustaining the force remained a constant struggle.
        </SectionHeading>
        <div className="data-grid data-grid-featured">
          <ArmyChart data={armyData} darkMode={darkMode} onYearClick={handleYearClick} />
          <CampaignTimeline data={campaignData} darkMode={darkMode} />
        </div>
      </section>

      <section className="data-group" aria-labelledby="trade-title">
        <SectionHeading id="trade-title" number="02" eyebrow="Economic rupture" title="Trade falls off a cliff">
          Indexed to the 1771 peak, the scale of wartime separation becomes unmistakable.
        </SectionHeading>
        <div>
          <TradeChart data={economicData} darkMode={darkMode} />
        </div>
      </section>

      <section className="data-group" aria-labelledby="battle-title">
        <SectionHeading id="battle-title" number="03" eyebrow="The cost of battle" title="Victory and loss were rarely proportional">
          Compare absolute casualties with the share of each force taken out of action.
        </SectionHeading>
        <div className="data-grid">
          <CasualtiesChart
            data={battleData}
            darkMode={darkMode}
            onBattleClick={onNavigateToEvent}
          />
          <BattleComparison battles={battles} darkMode={darkMode} />
        </div>
      </section>

      <footer className="data-methodology">
        <p className="editorial-kicker">Methodology</p>
        <h3>About the figures</h3>
        <p>
          Revolutionary-era troop and casualty estimates vary by source. Figures here
          use rounded historical estimates and should be read as comparative scale,
          not exact accounting. Battle records are drawn from the American Battlefield
          Trust; political context is cross-referenced with National Park Service records.
        </p>
      </footer>
    </article>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('amreviz-dark-mode') === 'true';
    } catch {
      return false;
    }
  });
  const [view, setView, , syncView, navigationRequest] = useHashRouter('welcome');
  const [pendingEventId, setPendingEventId] = useState(() => (
    navigationRequest.view === 'explore' ? navigationRequest.subId : null
  ));
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    localStorage.setItem('amreviz-dark-mode', darkMode);
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  useEffect(() => {
    setPendingEventId(
      navigationRequest.view === 'explore' ? navigationRequest.subId : null,
    );
  }, [navigationRequest]);

  useEffect(() => {
    const handleKey = (event) => {
      if (shortcutsOpen) return;
      if (event.target.closest('input, textarea, select, button, a, [role="button"], [contenteditable="true"]')) return;
      if ((event.key === 'd' || event.key === 'D') && !event.ctrlKey && !event.metaKey) {
        setDarkMode(current => !current);
      }
      if (event.key === '1') setView('explore');
      if (event.key === '2') setView('data');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setView, shortcutsOpen]);

  const handleNavigateToEvent = useCallback((eventId) => {
    setPendingEventId(eventId);
    setView('explore', eventId);
  }, [setView]);

  const handleStoryEventChange = useCallback((eventId) => {
    syncView('explore', eventId);
  }, [syncView]);

  const showHeader = view !== 'welcome';
  const pageMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.01 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AnimatePresence>
        {showHeader && (
          <Motion.header
            className="app-header"
            initial={reduceMotion ? false : { y: -48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduceMotion ? undefined : { y: -48, opacity: 0 }}
            inert={shortcutsOpen ? true : undefined}
          >
            <button className="masthead-home" onClick={() => setView('welcome')} aria-label="Return to introduction">
              <span className="masthead-edition">1773—1783</span>
              <span className="masthead-title">The American Revolution</span>
            </button>
            <div className="header-context" aria-hidden="true">
              {view === 'explore' ? `${chapters.length} chapters · ${events.length} events` : 'A visual record of war and independence'}
            </div>
            <div className="header-controls">
              <ViewToggle view={view} onViewChange={setView} />
              <HelpToggle onClick={() => setShortcutsOpen(true)} />
              <ModeToggle darkMode={darkMode} onToggle={() => setDarkMode(current => !current)} />
            </div>
          </Motion.header>
        )}
      </AnimatePresence>

      <main
        id="main-content"
        className={`app-main view-${view}`}
        inert={shortcutsOpen ? true : undefined}
      >
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <WelcomeScreen
              key="welcome"
              onBegin={() => setView('explore')}
              onOpenData={() => setView('data')}
              darkMode={darkMode}
            />
          )}
          {view === 'explore' && (
            <Motion.div key="explore" className="story-view-wrapper" {...pageMotion}>
              <ExploreView
                events={events}
                chapters={chapters}
                colonyBoundaries={colonyBoundaries}
                darkMode={darkMode}
                onExitToWelcome={() => setView('welcome')}
                initialEventId={pendingEventId}
                onConsumeInitialEvent={() => setPendingEventId(null)}
                onEventChange={handleStoryEventChange}
                keyboardShortcutsOpen={shortcutsOpen}
              />
            </Motion.div>
          )}
          {view === 'data' && (
            <Motion.div className="data-view-container" key="data" {...pageMotion}>
              <DataView darkMode={darkMode} onNavigateToEvent={handleNavigateToEvent} />
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
      <KeyboardShortcuts
        darkMode={darkMode}
        isOpen={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
    </div>
  );
}
