import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import useHashRouter, { readRoute } from './hooks/useHashRouter';
import useReducedMotion from './hooks/useReducedMotion';
import { eventSlug, resolveEventKey } from './data/events';
import './App.css';

// The URL names an event by slug; the story and the data view speak in ids.
// A key that names nothing — a retired number, a misspelt slug — is passed
// down as an id no event has, so the story can see that a jump was asked for
// and answer by writing back the event it is actually showing.
const NO_SUCH_EVENT = -1;
const eventIdForKey = (key) => (key == null ? null : resolveEventKey(key) ?? NO_SUCH_EVENT);

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
  
  const [view, setView, subKey, subKeyFromStory] = useHashRouter('welcome');
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  const navigateToView = useCallback((nextView, nextSubKey = null) => {
    setDirection(VIEW_ORDER[nextView] >= VIEW_ORDER[view] ? 1 : -1);
    setView(nextView, nextSubKey);
  }, [setView, view]);

  // The last event the story was on, so the Explore tab and the `1` key go
  // back to it rather than to the Stamp Act Congress. Data → Explore used to
  // drop the reader at step 1 (Back kept their place; the tab did not), and
  // pressing Explore while already there pushed a bare `#/explore` that the
  // story then corrected — one dead history entry per click.
  const lastExploreKey = useRef(null);
  useEffect(() => {
    if (view === 'explore' && subKey != null) lastExploreKey.current = subKey;
  }, [view, subKey]);

  const openView = useCallback((nextView) => {
    navigateToView(nextView, nextView === 'explore' ? lastExploreKey.current : null);
  }, [navigateToView]);

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
      // Cmd+1 / Cmd+2 are the browser's own tab switches; Cmd+D bookmarks.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'd' || e.key === 'D') setDarkMode(prev => !prev);
      if (e.key === '1') openView('explore');
      if (e.key === '2') openView('data');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openView]);

  const handleBeginJourney = () => {
    navigateToView('explore');
  };

  const handleExitToWelcome = () => {
    // "Start Over" means it: the next Begin starts from the first event.
    lastExploreKey.current = null;
    navigateToView('welcome');
  };

  // Seed from the URL so a deep link like #/explore/battle-of-bunker-hill
  // survives the first render.
  const [pendingEventId, setPendingEventId] = useState(() => eventIdForKey(subKey));

  // Forward the URL's event down to the story only when it came from outside
  // it — a pasted link, Back/Forward, or a jump from the data view.
  //
  // The story writes `subKey` itself on every step, and that key used to come
  // straight back down as an instruction to go there a frame or two later.
  // A reversal inside that window lost: press right then left within ~150ms
  // and the echo of the right press landed after the left one and pulled the
  // story forward again. Measured before the fix: 5 of 5 wrong at a 100ms
  // gap, and it is the reason two tests in the suite carry an explicit
  // settle. `fromStory` comes from the router with the key it belongs to, so
  // two steps in one batch cannot be misread for each other.
  useEffect(() => {
    if (view !== 'explore' || subKey == null || subKeyFromStory) return undefined;

    const frame = window.requestAnimationFrame(() => {
      setPendingEventId(eventIdForKey(subKey));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [view, subKey, subKeyFromStory]);

  const handleNavigateToEvent = useCallback((eventId) => {
    navigateToView('explore', eventSlug(eventId));
  }, [navigateToView]);

  const handleStoryEventChange = useCallback((eventId) => {
    // A step names a different event than the address bar does, and is
    // pushed so Back and Forward retrace it. Anything else is the story
    // correcting the address — a pre-slug number for this same event, a key
    // that named nothing, no key at all — and is replaced, so the junk never
    // becomes a place Back can land. Read from the address bar itself rather
    // than from route state: this is a judgement about what the bar says now.
    const named = resolveEventKey(readRoute().subKey);
    const replace = named == null || named === eventId;
    setView('explore', eventSlug(eventId), { fromStory: true, replace });
  }, [setView]);

  const handleConsumeInitialEvent = useCallback(() => {
    setPendingEventId(null);
  }, []);

  const showHeader = view !== 'welcome';

  const mainRef = useRef(null);
  const focusMain = useCallback(() => {
    mainRef.current?.focus();
  }, []);

  // A crossfade still signals that the view changed; the slide and the scale
  // are the parts a reader who asked for reduced motion does not want.
  const pageVariants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 }
      }
    : {
        initial: { opacity: 0, y: direction * 30, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: direction * -30, scale: 0.98 },
        transition: { duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }
      };

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {/* A button, not an `<a href="#main-content">`: routing here lives in the
          hash, and following that link would rewrite it to #main-content,
          which parses as an unknown view and drops the reader back on the
          welcome screen. */}
      {showHeader && (
        <button type="button" className="skip-link" onClick={focusMain}>
          Skip to the story
        </button>
      )}
      <AnimatePresence>
        {showHeader && (
          <Motion.header
            className="app-header"
            initial={reduceMotion ? { opacity: 0 } : { y: -64, opacity: 0 }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: -64, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
          >
            <div className="header-content">
              <h1>The American Revolution</h1>
              <p>An Interactive Journey Through Independence</p>
            </div>
            <div className="header-controls">
              <ViewToggle view={view} onViewChange={openView} />
              <HelpToggle />
              <ModeToggle darkMode={darkMode} onToggle={() => setDarkMode(!darkMode)} />
            </div>
          </Motion.header>
        )}
      </AnimatePresence>

      <main ref={mainRef} id="main-content" tabIndex={-1} className={`app-main ${view === 'welcome' ? 'no-header' : ''}`}>
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
                  routeEventId={eventIdForKey(subKey)}
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
