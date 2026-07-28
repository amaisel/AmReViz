import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

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
    { key: '\u2190 \u2192', desc: 'Previous / next event' },
    { key: '\u2191 \u2193', desc: 'Scroll the event details' },
    { key: 'C', desc: 'Toggle Focus cards / Show map' },
    { key: 'Esc', desc: 'Exit Focus cards (back to map)' },
    { key: 'Space', desc: 'Play / pause (Explore) · Begin journey (Welcome)' },
    { key: 'D', desc: 'Toggle dark mode' },
    { key: '1 / 2', desc: 'Switch to Explore / Data' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        >
          <Motion.div
            className={`shortcuts-panel ${darkMode ? 'dark' : ''}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Keyboard Shortcuts</h3>
            {shortcuts.map((s, i) => (
              <div key={i} className="shortcut-row">
                <kbd>{s.key}</kbd>
                <span>{s.desc}</span>
              </div>
            ))}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
