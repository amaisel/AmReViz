import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchBar({ events, onEventSelect, darkMode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    // Simple score-based search: title matches are better than description matches
    return events
      .map(e => {
        let score = 0;
        if (e.title.toLowerCase().includes(q)) score += 10;
        if (e.title.toLowerCase().startsWith(q)) score += 5;
        if (e.description.toLowerCase().includes(q)) score += 2;
        if (e.location.toLowerCase().includes(q)) score += 3;
        return { ...e, score };
      })
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, events]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

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
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`search-input ${darkMode ? 'dark' : ''}`}
          aria-label="Search historical events"
          aria-expanded={isOpen && results.length > 0}
          aria-controls="search-results-list"
          aria-haspopup="listbox"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="search-clear-btn"
              onClick={clearSearch}
              aria-label="Clear search"
              type="button"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/></svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
