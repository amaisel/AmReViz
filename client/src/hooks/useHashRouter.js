import { useState, useEffect, useCallback } from 'react';

const validViews = ['welcome', 'explore', 'data'];

// Backward compat: old routes redirect to explore
const legacyMap = { story: 'explore', timeline: 'explore' };

function parseHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const [viewPart, subPart] = hash.split('/');
  const normalizedView = legacyMap[viewPart] || viewPart;

  const view = validViews.includes(normalizedView) ? normalizedView : 'welcome';
  const parsedSubId = subPart ? Number.parseInt(subPart, 10) : null;
  const subId = Number.isFinite(parsedSubId) ? parsedSubId : null;

  return { view, subId };
}

function buildHash(view, subId) {
  if (view === 'welcome') return '';
  return `#/${view}${subId != null ? `/${subId}` : ''}`;
}

export default function useHashRouter(defaultView = 'welcome') {
  const [route, setRouteState] = useState(() => {
    const parsed = parseHash();
    const initialRoute = parsed.view !== 'welcome'
      ? parsed
      : { view: defaultView, subId: null };
    return {
      ...initialRoute,
      navigationRequest: { ...initialRoute, key: 0 },
    };
  });

  const setView = useCallback((newView, subId = null) => {
    setRouteState((prev) => {
      if (prev.view === newView && prev.subId === subId) return prev;
      return {
        view: newView,
        subId,
        navigationRequest: {
          view: newView,
          subId,
          key: prev.navigationRequest.key + 1,
        },
      };
    });

    const newHash = buildHash(newView, subId);
    if (window.location.hash !== newHash) {
      const nextUrl = `${window.location.pathname}${window.location.search}${newHash}`;
      window.history.pushState(window.history.state, '', nextUrl);
    }
  }, []);

  const syncView = useCallback((newView, subId = null) => {
    setRouteState((prev) => {
      if (prev.view === newView && prev.subId === subId) return prev;
      return { ...prev, view: newView, subId };
    });

    const newHash = buildHash(newView, subId);
    if (window.location.hash !== newHash) {
      const nextUrl = `${window.location.pathname}${window.location.search}${newHash}`;
      window.history.replaceState(window.history.state, '', nextUrl);
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = parseHash();
      setRouteState((prev) => {
        if (prev.view === parsed.view && prev.subId === parsed.subId) return prev;
        return {
          ...parsed,
          navigationRequest: {
            ...parsed,
            key: prev.navigationRequest.key + 1,
          },
        };
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return [route.view, setView, route.subId, syncView, route.navigationRequest];
}
