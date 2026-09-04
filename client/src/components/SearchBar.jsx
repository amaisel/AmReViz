import { useState, useMemo, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const tokenize = (query) => query.toLowerCase().split(/\s+/).filter(Boolean);

// Marks every token that occurs in the text, not only the phrase as typed.
function highlightMatch(text, query) {
  const tokens = tokenize(query);
  if (tokens.length === 0) return text;
  const lower = text.toLowerCase();
  const ranges = [];
  for (const token of tokens) {
    let from = 0;
    for (;;) {
      const idx = lower.indexOf(token, from);
      if (idx === -1) break;
      ranges.push([idx, idx + token.length]);
      from = idx + token.length;
    }
  }
  if (ranges.length === 0) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([...range]);
  }
  const parts = [];
  let cursor = 0;
  merged.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(<mark key={i} className="search-highlight">{text.slice(start, end)}</mark>);
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

export default function SearchBar({ events, onEventSelect, darkMode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const results = useMemo(() => {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];
    const phrase = tokens.join(' ');
    // Every word must match somewhere; the phrase as typed scores extra, and a
    // title match outranks one in the description. The old search matched the
    // whole string against each field, so "yorktown 1781" and "lexington
    // concord" found nothing, and a year found only events whose prose
    // happened to mention it.
    return events
      .map(e => {
        const title = e.title.toLowerCase();
        const description = e.description.toLowerCase();
        const location = e.location.toLowerCase();
        const year = String(e.year);
        let score = 0;
        for (const token of tokens) {
          let tokenScore = 0;
          if (title.includes(token)) tokenScore += 10;
          if (title.startsWith(token)) tokenScore += 5;
          if (location.includes(token)) tokenScore += 3;
          if (description.includes(token)) tokenScore += 2;
          if (year === token || e.date.toLowerCase().includes(token)) tokenScore += 8;
          if (tokenScore === 0) return { ...e, score: 0 };
          score += tokenScore;
        }
        if (tokens.length > 1 && title.includes(phrase)) score += 10;
        return { ...e, score };
      })
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score || a.year - b.year)
      .slice(0, 10);
  }, [query, events]);

  // Mirrors the render condition for the listbox below, so aria-expanded and
  // aria-activedescendant never advertise a popup that isn't mounted.
  const listboxOpen = isOpen && Boolean(query.trim());

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectEvent(results[activeIndex].id);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const selectEvent = (id) => {
    onEventSelect(id);
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const clearSearch = () => {
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="search-bar-wrapper" onKeyDown={handleKeyDown}>
      <div className="search-input-container">
        <svg 
          className="search-icon" 
          viewBox="0 0 16 16" 
          width="18" 
          height="18" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="4.5"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search events..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`search-input ${darkMode ? 'dark' : ''}`}
          role="combobox"
          aria-label="Search historical events"
          aria-expanded={listboxOpen}
          // Only reference the listbox while it is actually in the DOM
          aria-controls={listboxOpen ? 'search-results-list' : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            listboxOpen && activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
          }
        />
        <AnimatePresence>
          {query && (
            <Motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="search-clear-btn"
              onClick={clearSearch}
              aria-label="Clear search"
              type="button"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
            </Motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isOpen && query.trim() && (
          <Motion.div
            id="search-results-list"
            className="search-results"
            role="listbox"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            ref={resultsRef}
          >
            {results.length > 0 ? (
              results.map((e, index) => (
                <button
                  key={e.id}
                  id={`search-item-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`search-result-item ${index === activeIndex ? 'active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    selectEvent(e.id);
                  }}
                >
                  <span className="search-result-year">{e.year}</span>
                  <div className="search-result-info">
                    <span className="search-result-title">{highlightMatch(e.title, query)}</span>
                    <span className="search-result-location">{e.location}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="search-no-results">
                No events match "{query}"
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
