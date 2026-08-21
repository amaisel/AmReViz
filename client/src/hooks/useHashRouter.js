import { useState, useEffect, useCallback } from 'react';

const validViews = ['welcome', 'explore', 'data'];

// Backward compat: old routes redirect to explore
const legacyMap = { story: 'explore', timeline: 'explore' };

// Event ids are positive integers, so anything else in the sub-part is
// syntactic junk the router can reject on its own — `#/explore/abc`,
// `#/explore/-3`. Whether a well-formed id names a real event is a question
// only the story can answer, and it corrects the URL itself in that case.
function parseHash() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const [viewPart, subPart] = hash.split('/');

  const normalizedView = legacyMap[viewPart] || viewPart;
  const view = validViews.includes(normalizedView) ? normalizedView : 'welcome';

  const parsedSub = subPart ? Number(subPart) : null;
  const subId = Number.isInteger(parsedSub) && parsedSub > 0 ? parsedSub : null;
  // A sub-part was written but did not survive parsing, so the address bar is
  // currently claiming something the app will not honour.
  const malformedSub = Boolean(subPart) && subId == null;

  return { view, subId, malformedSub };
}

export default function useHashRouter(defaultView = 'welcome') {
  const [route, setRouteState] = useState(() => {
    const parsed = parseHash();
    const base = parsed.view !== 'welcome'
      ? { view: parsed.view, subId: parsed.subId }
      : { view: defaultView, subId: null };
    return { ...base, fromStory: false, malformedSub: parsed.malformedSub };
  });

  // `fromStory` marks a route the story wrote as it stepped, as opposed to one
  // that arrived from outside — a pasted link, Back/Forward, or a jump from
  // the data view. The consumer feeds `subId` back down as the event to show,
  // so without this flag every step's own id returned a frame later as an
  // instruction to go there, and a reversal inside that window lost.
  //
  // It lives in the route object rather than in a ref because two steps can
  // land in one batch: a ref holds only the newer of the two, and the effect
  // for the older one then reads it and concludes the id was external.
  const setView = useCallback((newView, subId = null, { fromStory = false } = {}) => {
    setRouteState(prev =>
      prev.view === newView && prev.subId === subId && !prev.malformedSub
        ? prev
        : { view: newView, subId, fromStory, malformedSub: false }
    );
    let newHash = '';
    if (newView !== 'welcome') {
      newHash = `#/${newView}`;
      if (subId != null) newHash += `/${subId}`;
    }
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash();
      // Every `setView` writes the hash, so each one comes back as a
      // `hashchange` naming the route we are already on. Bailing out when the
      // parsed route matches the state we hold drops those echoes without
      // needing to count them — which matters, because two writes in one
      // batch can produce two events that both read the second hash, and
      // nothing in the event itself distinguishes them.
      setRouteState(prev =>
        prev.view === parsed.view
        && prev.subId === parsed.subId
        && prev.malformedSub === parsed.malformedSub
          ? prev
          : { view: parsed.view, subId: parsed.subId, fromStory: false, malformedSub: parsed.malformedSub }
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Strip a sub-part the router rejected, so the address bar stops advertising
  // an event that was never going to load. Dropping it rather than guessing a
  // replacement: what the app shows next is the story's decision, and its own
  // sync writes the real id a frame later.
  useEffect(() => {
    if (!route.malformedSub) return;
    const cleaned = route.view === 'welcome' ? '' : `#/${route.view}`;
    // No setState here: the write below fires a `hashchange`, the handler
    // re-parses a hash that now has no sub-part, and `malformedSub` clears
    // itself. `malformedSub` is only ever true when a sub-part is present, so
    // the cleaned hash always differs and the event always comes.
    window.location.hash = cleaned;
  }, [route.malformedSub, route.view]);

  return [route.view, setView, route.subId, route.fromStory];
}
