import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import ExploreView from './components/ExploreView';
import { ArmyChart, TradeChart, CasualtiesChart, CampaignTimeline } from './components/Charts';
import BattleComparison from './components/BattleComparison';
import AnimatedCounter from './components/AnimatedCounter';
import { events, armyData, economicData, battleData, campaignData } from './data/events';
import { colonyBoundaries } from './data/colonyBoundaries';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import useHashRouter from './hooks/useHashRouter';
import './App.css';

function ModeToggle({ darkMode, onToggle }) {
  return (
    <button
      className="mode-toggle"
      onClick={onToggle}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      )}
    </button>
  );
}

function HelpToggle() {
  return (
    <button
      className="mode-toggle help-toggle"
      onClick={() => {
        const event = new KeyboardEvent('keydown', { key: '?' });
        window.dispatchEvent(event);
      }}
      aria-label="Show keyboard shortcuts"
      title="Keyboard Shortcuts (?)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </button>
  );
}

function ViewToggle({ view, onViewChange }) {
  const views = [
    { id: 'explore', label: 'Explore' },
    { id: 'data', label: 'Data' }
  ];

  return (
    <div className="view-toggle">
      {views.map((item) => (
        <button
          key={item.id}
          className={view === item.id ? 'active' : ''}
          onClick={() => onViewChange(item.id)}
          style={{ position: 'relative' }}
        >
          {view === item.id && (
            <motion.div
              layoutId="activeView"
              className="active-bg"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '6px',
                background: 'var(--color-bg-light)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 0
              }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function DataView({ darkMode, onNavigateToEvent }) {
  const battles = events.filter(e => e.casualties);

  const handleBattleClick = (eventId) => {
    onNavigateToEvent?.(eventId);
  };

  const handleYearClick = (year) => {
    const match = events.find(e => e.year === year);
    if (match) onNavigateToEvent?.(match.id);
  };

  return (
    <div className="data-view">
      <header className="data-section">
        <h2>Forces & Economy</h2>
        <p className="data-subtitle">
          Visualizing the Revolution through numbers
        </p>
      </header>

      <div className="data-insights">
        <div className="insight-card">
          <h4>Peak Continental Army</h4>
          <AnimatedCounter value={35000} className="insight-value" />
          <p>troops in 1778 after Valley Forge training</p>
        </div>
        <div className="insight-card">
          <h4>Trade Collapse</h4>
          <AnimatedCounter value={75} prefix="-" suffix="%" className="insight-value" />
          <p>drop in British imports 1774-1776</p>
        </div>
        <div className="insight-card">
          <h4>War Deaths</h4>
          <AnimatedCounter value={25000} className="insight-value" />
          <p>American casualties (combat + disease)</p>
        </div>
      </div>

      <section className="data-group">
        <h3 className="data-group-title">Military Strength & Theater</h3>
        <div className="data-grid">
          <ArmyChart data={armyData} darkMode={darkMode} onYearClick={handleYearClick} />
          <CampaignTimeline data={campaignData} darkMode={darkMode} />
        </div>
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Economic Impact</h3>
        <TradeChart data={economicData} darkMode={darkMode} />
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Battle Analysis</h3>
        <div className="data-grid">
          <CasualtiesChart data={battleData} darkMode={darkMode} onBattleClick={handleBattleClick} />
          <BattleComparison battles={battles} darkMode={darkMode} />
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('amreviz-dark-mode') === 'true';
    } catch { return false; }
  });
  
  const [view, setView, subId] = useHashRouter('welcome');

  useEffect(() => {
    localStorage.setItem('amreviz-dark-mode', darkMode);
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey) setDarkMode(prev => !prev);
      }
      if (e.key === '1') setView('explore');
      if (e.key === '2') setView('data');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setView]);

  // Track view direction for transitions
  const viewOrder = { welcome: 0, explore: 1, data: 2 };
  const prevViewRef = useRef(view);
  const direction = viewOrder[view] >= viewOrder[prevViewRef.current] ? 1 : -1;
  useEffect(() => { prevViewRef.current = view; }, [view]);

  const handleBeginJourney = () => {
    setView('explore');
  };

  const handleExitToWelcome = () => {
    setView('welcome');
  };

  const [pendingEventId, setPendingEventId] = useState(null);

  // Sync subId from URL to pendingEventId
  useEffect(() => {
    if (view === 'explore' && subId != null) {
      setPendingEventId(subId);
    }
  }, [view, subId]);

  const handleNavigateToEvent = (eventId) => {
    setView('explore', eventId);
  };

  const showHeader = view !== 'welcome';

  const pageVariants = {
    initial: { opacity: 0, y: direction * 30, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: direction * -30, scale: 0.98 },
    transition: { duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <AnimatePresence>
        {showHeader && (
          <motion.header
            className="app-header"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="header-content">
              <h1>The American Revolution</h1>
              <p>An Interactive Journey Through Independence</p>
            </div>
            <div className="header-controls">
              <ViewToggle view={view} onViewChange={setView} />
              <HelpToggle />
              <ModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className={`app-main ${view === 'welcome' ? 'no-header' : ''}`}>
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <WelcomeScreen
              key="welcome"
              onBegin={handleBeginJourney}
              darkMode={darkMode}
            />
          )}

          {view === 'explore' && (
            <motion.div
              key="explore"
              className="story-view-wrapper"
              {...pageVariants}
            >
              <ExploreView
                events={events}
                colonyBoundaries={colonyBoundaries}
                darkMode={darkMode}
                onExitToWelcome={handleExitToWelcome}
                initialEventId={pendingEventId}
                onConsumeInitialEvent={() => setPendingEventId(null)}
                onEventChange={(eventId) => setView('explore', eventId)}
              />
            </motion.div>
          )}

          {view === 'data' && (
            <motion.div
              className="data-view-container"
              key="data"
              {...pageVariants}
            >
              <DataView darkMode={darkMode} onNavigateToEvent={handleNavigateToEvent} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <KeyboardShortcuts darkMode={darkMode} />
    </div>
  );
}
