import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';
import HorizontalTimeline from './components/HorizontalTimeline';
import EventCard from './components/EventCard';
import WelcomeScreen from './components/WelcomeScreen';
import ScrollytellingView from './components/ScrollytellingView';
import { ArmyChart, TradeChart } from './components/Charts';
import { events, armyData, economicData } from './data/events';
import { colonyBoundaries } from './data/colonyBoundaries';
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

function ViewToggle({ view, onViewChange }) {
  const views = [
    { id: 'story', label: 'Story' },
    { id: 'timeline', label: 'Timeline' },
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

function DataView({ activeYear, darkMode }) {
  return (
    <div className="data-view">
      <div className="data-section">
        <h2>Forces & Economy</h2>
        <p className="data-subtitle">
          Visualizing the Revolution through numbers
        </p>
      </div>

      <ArmyChart data={armyData} activeYear={activeYear} darkMode={darkMode} />
      <TradeChart data={economicData} darkMode={darkMode} />

      <div className="data-insights">
        <div className="insight-card">
          <h4>Peak Continental Army</h4>
          <span className="insight-value">35,000</span>
          <p>troops in 1778 after Valley Forge training</p>
        </div>
        <div className="insight-card">
          <h4>Trade Collapse</h4>
          <span className="insight-value">-75%</span>
          <p>drop in British imports 1774-1776</p>
        </div>
        <div className="insight-card">
          <h4>War Deaths</h4>
          <span className="insight-value">25,000</span>
          <p>American casualties (combat + disease)</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeEventId, setActiveEventId] = useState(null);
  const [view, setView] = useState('welcome');
  const [showColonies, setShowColonies] = useState(true);
  const [hideFutureEvents, setHideFutureEvents] = useState(false);

  const activeEvent = events.find(e => e.id === activeEventId);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  const handleBeginJourney = () => {
    setView('story');
  };

  const handleExitToWelcome = () => {
    setView('welcome');
  };

  const showHeader = view !== 'welcome';

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -20, scale: 0.99 },
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

          {view === 'story' && (
            <motion.div
              key="story"
              className="story-view-wrapper"
              {...pageVariants}
            >
              <ScrollytellingView
                events={events}
                colonyBoundaries={colonyBoundaries}
                darkMode={darkMode}
                onExitToWelcome={handleExitToWelcome}
              />
            </motion.div>
          )}

          {view === 'timeline' && (
            <motion.div
              className="timeline-view"
              key="timeline"
              {...pageVariants}
            >
              <div className="map-area">
                <Map
                  events={events}
                  colonyBoundaries={colonyBoundaries}
                  activeEventId={activeEventId}
                  onEventClick={setActiveEventId}
                  showColonies={showColonies}
                  darkMode={darkMode}
                  hideFutureEvents={hideFutureEvents}
                />
                <EventCard event={activeEvent} darkMode={darkMode} />
              </div>
              <HorizontalTimeline
                events={events}
                activeEventId={activeEventId}
                onEventClick={setActiveEventId}
                darkMode={darkMode}
              />
            </motion.div>
          )}

          {view === 'data' && (
            <motion.div
              className="data-view-container"
              key="data"
              {...pageVariants}
            >
              <DataView activeYear={activeEvent?.year} darkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
