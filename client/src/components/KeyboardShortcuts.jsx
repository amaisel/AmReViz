import { useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function KeyboardShortcuts({ darkMode, isOpen, onOpenChange }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return undefined;

    returnFocusRef.current = document.activeElement;
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const trapFocus = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', trapFocus);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', trapFocus);
      returnFocusRef.current?.focus();
    };
  }, [isOpen]);

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
        <Motion.div
          className="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <Motion.div
            ref={panelRef}
            className={`shortcuts-panel ${darkMode ? 'dark' : ''}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            tabIndex={-1}
          >
            <div className="shortcuts-heading">
              <h3 id="shortcuts-title">Keyboard shortcuts</h3>
              <button
                ref={closeButtonRef}
                onClick={() => onOpenChange(false)}
                aria-label="Close keyboard shortcuts"
              >
                ×
              </button>
            </div>
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
