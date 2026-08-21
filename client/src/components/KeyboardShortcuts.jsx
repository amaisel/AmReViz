import { useState, useEffect, useRef, useCallback } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { key: '?', desc: 'Toggle this help' },
  { key: '← →', desc: 'Previous / next event' },
  { key: '↑ ↓', desc: 'Scroll the event details' },
  { key: 'C', desc: 'Toggle Focus cards / Show map' },
  { key: 'Esc', desc: 'Exit Focus cards (back to map)' },
  { key: 'Space', desc: 'Play / pause (Explore) · Begin journey (Welcome)' },
  { key: 'D', desc: 'Toggle dark mode' },
  { key: '1 / 2', desc: 'Switch to Explore / Data' },
];

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function KeyboardShortcuts({ darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  // Where focus was when the dialog opened, so it can be handed back.
  const returnFocusRef = useRef(null);

  const close = useCallback(() => setIsOpen(false), []);

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

  // Remember the opener before the dialog paints over it, and give focus back
  // on close: without this, dismissing the dialog dropped the keyboard reader
  // at the top of the document.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement;
      // The close button rather than the panel: it is the one action the
      // dialog offers, and it puts Tab at a predictable starting point.
      const frame = requestAnimationFrame(() => closeRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }
    const opener = returnFocusRef.current;
    returnFocusRef.current = null;
    if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    return undefined;
  }, [isOpen]);

  // Keep Tab inside the dialog. A modal that lets focus walk out from behind
  // its own backdrop is a dialog in appearance only.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter(
        el => !el.hasAttribute('disabled') && el.getBoundingClientRect().width > 0
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="shortcuts-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
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
          >
            <div className="shortcuts-header">
              <h3 id="shortcuts-title">Keyboard Shortcuts</h3>
              <button
                ref={closeRef}
                type="button"
                className="shortcuts-close"
                onClick={close}
                aria-label="Close keyboard shortcuts"
              >
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              </button>
            </div>
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="shortcut-row">
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
