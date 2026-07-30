import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import useHashRouter from './hooks/useHashRouter';
import './App.css';

const ExploreRoute = lazy(() => import('./components/ExploreRoute'));
const DataView = lazy(() => import('./components/DataView'));

const VIEW_ORDER = { welcome: 0, explore: 1, data: 2 };

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
            <Motion.div
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

function ViewLoading({ label }) {
  return (
    <div className="view-loading" role="status" aria-live="polite">
      <span className="view-loading-mark" aria-hidden="true" />
      <p>Loading {label}…</p>
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
  const [direction, setDirection] = useState(1);

  const navigateToView = useCallback((nextView, nextSubId = null) => {
    setDirection(VIEW_ORDER[nextView] >= VIEW_ORDER[view] ? 1 : -1);
    setView(nextView, nextSubId);
  }, [setView, view]);

  useEffect(() => {
    try {
      localStorage.setItem('amreviz-dark-mode', darkMode);
    } catch {
      // Local storage can be unavailable in privacy-restricted contexts;
      // the theme still applies for this session.
    }
    // Toggle only our own classes so anything else on <body> survives.
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
  }, [darkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey) setDarkMode(prev => !prev);
      }
      if (e.key === '1') navigateToView('explore');
      if (e.key === '2') navigateToView('data');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigateToView]);

  const handleBeginJourney = () => {
    navigateToView('explore');
  };

  const handleExitToWelcome = () => {
    navigateToView('welcome');
  };

  // Seed from the URL so a deep link like #/explore/5 survives the first render
  const [pendingEventId, setPendingEventId] = useState(subId);

  // Sync subId from URL to pendingEventId
  useEffect(() => {
    if (view !== 'explore' || subId == null) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setPendingEventId(subId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [view, subId]);

  const handleNavigateToEvent = useCallback((eventId) => {
    navigateToView('explore', eventId);
  }, [navigateToView]);

  const handleStoryEventChange = useCallback((eventId) => {
    setView('explore', eventId);
  }, [setView]);

  const handleConsumeInitialEvent = useCallback(() => {
    setPendingEventId(null);
  }, []);

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
          <Motion.header
            className="app-header"
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="header-content">
              <h1>
                <span className="header-title-full">The American Revolution</span>
                <span className="header-title-short">Revolution</span>
              </h1>
              <p>An Interactive Journey Through Independence</p>
            </div>
            <div className="header-controls">
              <ViewToggle view={view} onViewChange={navigateToView} />
              <HelpToggle />
              <ModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>
          </Motion.header>
        )}
      </AnimatePresence>

      <main className={`app-main ${view === 'welcome' ? 'no-header' : ''}`}>
        <AnimatePresence mode="wait">
          {view === 'welcome' && (
            <WelcomeScreen
              key="welcome"
              onBegin={handleBeginJourney}
              onOpenData={() => navigateToView('data')}
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(prev => !prev)}
            />
          )}

          {view === 'explore' && (
            <Motion.div
              key="explore"
              className="story-view-wrapper"
              {...pageVariants}
            >
              <Suspense fallback={<ViewLoading label="the map" />}>
                <ExploreRoute
                  darkMode={darkMode}
                  onExitToWelcome={handleExitToWelcome}
                  initialEventId={pendingEventId}
                  onConsumeInitialEvent={handleConsumeInitialEvent}
                  onEventChange={handleStoryEventChange}
                />
              </Suspense>
            </Motion.div>
          )}

          {view === 'data' && (
            <Motion.div
              className="data-view-container"
              key="data"
              {...pageVariants}
            >
              <Suspense fallback={<ViewLoading label="the data" />}>
                <DataView darkMode={darkMode} onNavigateToEvent={handleNavigateToEvent} />
              </Suspense>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>
      <KeyboardShortcuts darkMode={darkMode} />
    </div>
  );
}
