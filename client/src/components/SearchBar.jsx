import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchBar({ events, onEventSelect, darkMode }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

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
      <input
        type="text"
        placeholder="Search events..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={`search-input ${darkMode ? 'dark' : ''}`}
      />
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
                <span className="search-result-title">{e.title}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
