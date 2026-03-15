import { useState, useEffect, useCallback } from 'react';

const validViews = ['welcome', 'explore', 'data'];

// Backward compat: old routes redirect to explore
const legacyMap = { story: 'explore', timeline: 'explore' };

function getViewFromHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (legacyMap[hash]) {
    window.location.hash = `#/${legacyMap[hash]}`;
    return legacyMap[hash];
  }
  return validViews.includes(hash) ? hash : 'welcome';
}

export default function useHashRouter(defaultView = 'welcome') {
  const [view, setViewState] = useState(() => {
    const hashView = getViewFromHash();
    return hashView !== 'welcome' ? hashView : defaultView;
  });

  const setView = useCallback((newView) => {
    setViewState(newView);
    window.location.hash = newView === 'welcome' ? '' : `#/${newView}`;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setViewState(getViewFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return [view, setView];
}
