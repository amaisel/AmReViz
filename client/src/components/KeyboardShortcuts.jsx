import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcuts({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const shortcuts = [
    { key: '?', desc: 'Toggle this help' },
    { key: '\u2191 \u2193', desc: 'Move through story events' },
    { key: '\u2190 \u2192', desc: 'Move through story events' },
    { key: 'Space', desc: 'Play or pause the chronology' },
    { key: 'D', desc: 'Toggle dark mode' },
    { key: '1 / 2', desc: 'Switch to Story / Data' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            className={`shortcuts-panel ${darkMode ? 'dark' : ''}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="shortcuts-heading">
              <h3 id="shortcuts-title">Keyboard shortcuts</h3>
              <button onClick={() => setIsOpen(false)} aria-label="Close keyboard shortcuts">×</button>
            </div>
            {shortcuts.map((s, i) => (
              <div key={i} className="shortcut-row">
                <kbd>{s.key}</kbd>
                <span>{s.desc}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
