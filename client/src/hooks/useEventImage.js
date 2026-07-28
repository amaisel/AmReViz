import { useState, useEffect } from 'react';

// Module-level cache so each event's image is resolved once per session
const resolved = new Map();

/**
 * Resolves the hero image for an event.
 *
 * 1. Prefer the locally bundled file (public/events/…, populated by
 *    `npm run fetch:images`).
 * 2. If it's missing, resolve the event's Wikipedia article lead image
 *    in the browser (public-domain paintings/engravings for these
 *    18th-century subjects) and hotlink it.
 * 3. If both fail, returns null and the card renders without an image.
 *
 * Returns { src, credit } — credit is the Wikipedia article URL when
 * hotlinking, null when serving the bundled copy.
 */
export default function useEventImage(event) {
  const key = event?.id;
  const initial = () => resolved.get(key) ?? { src: event?.image ?? null, credit: null, probing: true };
  const [state, setState] = useState(initial);

  // Re-seed during render when the card switches events, otherwise the
  // previous event's image paints for a frame before the effect corrects it.
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    setLastKey(key);
    setState(initial);
  }

  useEffect(() => {
    if (!event?.image) { setState({ src: null, credit: null, probing: false }); return; }
    if (resolved.has(event.id)) { setState(resolved.get(event.id)); return; }

    let cancelled = false;
    const settle = (s) => {
      resolved.set(event.id, s);
      if (!cancelled) setState(s);
    };

    const probe = new Image();
    probe.onload = () => settle({ src: event.image, credit: null, probing: false });
    probe.onerror = async () => {
      // Without a slug there is no article to fall back to.
      if (!event.wiki) { settle({ src: null, credit: null, probing: false }); return; }
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(event.wiki)}`
        );
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const thumb = data.thumbnail?.source;
        // Ask MediaWiki for a bigger rendition than the default summary thumb
        const src = data.originalimage?.source && thumb
          ? thumb.replace(/\/(\d+)px-/, '/1000px-')
          : thumb ?? null;
        settle({
          src,
          credit: src ? `https://en.wikipedia.org/wiki/${event.wiki}` : null,
          probing: false,
        });
      } catch {
        settle({ src: null, credit: null, probing: false });
      }
    };
    probe.src = event.image;

    return () => { cancelled = true; };
  }, [event?.id, event?.image, event?.wiki]);

  return state;
}
