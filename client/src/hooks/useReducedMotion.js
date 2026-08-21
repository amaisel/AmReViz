import { useCallback, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// Framer Motion ships `useReducedMotion`, and WelcomeScreen already uses it.
// This exists because the two places that matter most are not Framer's to
// answer: Leaflet's flights between events, and the bottom sheet's spring,
// both of which are driven by imperative APIs. One hook keeps the answer to
// "should this move?" identical everywhere, including in components that
// never render a Motion element.
//
// `useSyncExternalStore` rather than state-plus-effect: the media query is an
// external store, and subscribing to it that way means there is no window
// between the first render and the subscription in which a stale answer can
// be read.
export default function useReducedMotion() {
  const subscribe = useCallback((onChange) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mql = window.matchMedia(QUERY);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(QUERY).matches;
  }, []);

  // Server render has no preference to read; assume motion is fine and let
  // hydration correct it.
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
