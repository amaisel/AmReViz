import { useState, useEffect, useCallback } from 'react';

const validViews = ['welcome', 'explore', 'data'];

// Backward compat: old routes redirect to explore
const legacyMap = { story: 'explore', timeline: 'explore' };

// The sub-part names an event by slug — `#/explore/battle-of-bunker-hill` —
// or, in links from before slugs, by its number. Both are lowercase words and
// digits joined by single hyphens, so anything else is syntactic junk the
// router can reject on its own: `#/explore/-3`, `#/explore/Bunker%20Hill`.
// Whether a well-formed key names a real event is a question only the story
// can answer, and it corrects the URL itself in that case.
const SUB_KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const hashFor = (view, subKey) => {
  if (view === 'welcome') return '';
  return subKey != null ? `#/${view}/${subKey}` : `#/${view}`;
};

// Where the address bar points right now, as the app will honour it. A
// sub-part the router rejects is reported as absent, and `malformed` says so,
// so the caller can put the address bar right.
export function readRoute() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  const [viewPart, subPart] = hash.split('/');

  const normalizedView = legacyMap[viewPart] || viewPart;
  const view = validViews.includes(normalizedView) ? normalizedView : 'welcome';

  const subKey = subPart && SUB_KEY.test(subPart) ? subPart : null;
  const malformed = Boolean(subPart) && subKey == null;

  return { view, subKey, malformed };
}

// Rewrite the address without adding to history. `replaceState` fires no
// `hashchange`, so callers that need the route state to follow must set it
// themselves; the ones here already have.
function replaceHash(hash) {
  window.history.replaceState(
    window.history.state,
    '',
    hash || `${window.location.pathname}${window.location.search}`,
  );
}

// Strip a sub-part the router rejected, so the address bar stops advertising
// an event that was never going to load. Dropping it rather than guessing a
// replacement: what the app shows next is the story's decision, and its own
// sync writes the real slug a frame later. Replaced, not pushed: the junk
// address is not somewhere the reader should be able to go Back to.
function cleanIfMalformed(parsed) {
  if (parsed.malformed) replaceHash(hashFor(parsed.view, null));
}

export default function useHashRouter(defaultView = 'welcome') {
  const [route, setRouteState] = useState(() => {
    const parsed = readRoute();
    const base = parsed.view !== 'welcome'
      ? { view: parsed.view, subKey: parsed.subKey }
      : { view: defaultView, subKey: null };
    return { ...base, fromStory: false };
  });

  // The initial read above is pure; if it rejected a sub-part, put the address
  // bar right now that the page has mounted.
  useEffect(() => {
    cleanIfMalformed(readRoute());
  }, []);

  // `fromStory` marks a route the story wrote as it stepped, as opposed to one
  // that arrived from outside — a pasted link, Back/Forward, or a jump from
  // the data view. The consumer feeds `subKey` back down as the event to show,
  // so without this flag every step's own key returned a frame later as an
  // instruction to go there, and a reversal inside that window lost.
  //
  // It lives in the route object rather than in a ref because two steps can
  // land in one batch: a ref holds only the newer of the two, and the effect
  // for the older one then reads it and concludes the key was external.
  //
  // `replace` is for writes that correct the address bar rather than move the
  // reader — a pre-slug number swapped for its slug, a key that named nothing
  // swapped for the event on screen. Pushing those leaves a trap behind: Back
  // lands on the old address, which is corrected forward again, and the page
  // before it cannot be reached.
  const setView = useCallback((newView, subKey = null, { fromStory = false, replace = false } = {}) => {
    setRouteState(prev =>
      prev.view === newView && prev.subKey === subKey
        ? prev
        : { view: newView, subKey, fromStory }
    );
    const newHash = hashFor(newView, subKey);
    if (window.location.hash === newHash) return;
    if (replace) {
      replaceHash(newHash);
    } else {
      window.location.hash = newHash;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = readRoute();
      cleanIfMalformed(parsed);
      // Every `setView` writes the hash, so each one comes back as a
      // `hashchange` naming the route we are already on. Bailing out when the
      // parsed route matches the state we hold drops those echoes without
      // needing to count them — which matters, because two writes in one
      // batch can produce two events that both read the second hash, and
      // nothing in the event itself distinguishes them.
      setRouteState(prev =>
        prev.view === parsed.view && prev.subKey === parsed.subKey
          ? prev
          : { view: parsed.view, subKey: parsed.subKey, fromStory: false }
      );
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return [route.view, setView, route.subKey, route.fromStory];
}
