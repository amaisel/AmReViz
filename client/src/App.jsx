import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Map from './components/Map';
import HorizontalTimeline from './components/HorizontalTimeline';
import { ArmyChart, TradeChart } from './components/Charts';
import { events, armyData, economicData, colonyData } from './data/events';
import './App.css';

function ModeToggle({ darkMode, onToggle }) {
  return (
    <button 
      className="mode-toggle"
      onClick={onToggle}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? '☀' : '☾'}
    </button>
  );
}

function ViewToggle({ view, onViewChange }) {
  return (
    <div className="view-toggle">
      <button 
        className={view === 'timeline' ? 'active' : ''}
        onClick={() => onViewChange('timeline')}
      >
        Timeline
      </button>
      <button 
        className={view === 'map' ? 'active' : ''}
        onClick={() => onViewChange('map')}
      >
        Map
      </button>
      <button 
        className={view === 'data' ? 'active' : ''}
        onClick={() => onViewChange('data')}
      >
        Data
      </button>
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
  const [activeEventId, setActiveEventId] = useState(1);
  const [view, setView] = useState('timeline');
  const [showColonies, setShowColonies] = useState(true);
  
  const activeEvent = events.find(e => e.id === activeEventId);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode';
  }, [darkMode]);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <header className="app-header">
        <div className="header-content">
          <h1>The American Revolution</h1>
          <p>An Interactive Journey Through Independence</p>
        </div>
        <div className="header-controls">
          <ViewToggle view={view} onViewChange={setView} />
          <ModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
        </div>
      </header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {view === 'timeline' && (
            <motion.div 
              className="timeline-view"
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="map-area">
                <Map 
                  events={events}
                  colonies={colonyData}
                  activeEventId={activeEventId}
                  onEventClick={setActiveEventId}
                  showColonies={showColonies}
                  darkMode={darkMode}
                />
              </div>
              <HorizontalTimeline 
                events={events}
                activeEventId={activeEventId}
                onEventClick={setActiveEventId}
                darkMode={darkMode}
              />
            </motion.div>
          )}

          {view === 'map' && (
            <motion.div 
              className="full-map-view"
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="map-controls">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={showColonies}
                    onChange={() => setShowColonies(!showColonies)}
                  />
                  Show Colonial Population
                </label>
              </div>
              <Map 
                events={events}
                colonies={colonyData}
                activeEventId={activeEventId}
                onEventClick={setActiveEventId}
                showColonies={showColonies}
                darkMode={darkMode}
                autoFly={false}
              />
              <div className="map-event-list">
                {events.map(event => (
                  <button
                    key={event.id}
                    className={`map-event-btn ${event.id === activeEventId ? 'active' : ''}`}
                    onClick={() => setActiveEventId(event.id)}
                  >
                    <span className="btn-year">{event.year}</span>
                    <span className="btn-title">{event.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'data' && (
            <motion.div 
              className="data-view-container"
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DataView activeYear={activeEvent?.year} darkMode={darkMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
