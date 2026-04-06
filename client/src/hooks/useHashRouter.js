import { useState, useEffect, useCallback } from 'react';

const validViews = ['welcome', 'explore', 'data'];

// Backward compat: old routes redirect to explore
const legacyMap = { story: 'explore', timeline: 'explore' };

function parseHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const [viewPart, subPart] = hash.split('/');
  
  const view = validViews.includes(viewPart) ? viewPart : 'welcome';
  const subId = subPart ? parseInt(subPart, 10) : null;
  
  return { view, subId };
}

export default function useHashRouter(defaultView = 'welcome') {
  const [route, setRouteState] = useState(() => {
    const parsed = parseHash();
    return parsed.view !== 'welcome' ? parsed : { view: defaultView, subId: null };
  });

  const setView = useCallback((newView, subId = null) => {
    setRouteState({ view: newView, subId });
    let newHash = '';
    if (newView !== 'welcome') {
      newHash = `#/${newView}`;
      if (subId != null) newHash += `/${subId}`;
    }
    window.location.hash = newHash;
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return [route.view, setView, route.subId];
}
