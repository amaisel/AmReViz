import { useState, useMemo, useRef } from 'react';
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
  const inputRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, events]);

  return (
    <div className="search-bar-wrapper">
      <div className="search-input-container">
        <svg className="search-icon" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="7" r="4.5"/>
          <line x1="10.5" y1="10.5" x2="14" y2="14"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className={`search-input ${darkMode ? 'dark' : ''}`}
        />
      </div>
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            className="search-results"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {results.map(e => (
              <button
                key={e.id}
                className="search-result-item"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  onEventSelect(e.id);
                  setQuery('');
                  setIsOpen(false);
                }}
              >
                <span className="search-result-year">{e.year}</span>
                <span className="search-result-title">{highlightMatch(e.title, query)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
