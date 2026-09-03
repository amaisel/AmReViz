import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { outcomeTheme, outcomeLabel as outcomeLabelFor, chartSeries } from '../constants/palette';

export default function BattleComparison({ battles, darkMode, selectedId: selectedIdProp, onSelect, onOpenStory }) {
  const [internalId, setInternalId] = useState(battles[0]?.id);
  const selectedId = selectedIdProp ?? internalId;
  const setSelectedId = (id) => {
    if (onSelect) onSelect(id);
    else setInternalId(id);
  };
  const selected = battles.find(b => b.id === selectedId) || battles[0];

  if (!selected) return null;

  // The badge was painted white-on-colour from a local table, which put white
  // on the gold at 2.49:1 for an indecisive engagement — the same failure the
  // event cards had. The palette carries a foreground alongside each fill.
  const outcome = outcomeTheme(selected.outcome, darkMode);
  const americanBar = chartSeries('american', darkMode).hue;
  const britishBar = chartSeries('british', darkMode).hue;

  const calculateRate = (casualties, forces) => {
    if (!forces) return '0%';
    return `${Math.round((casualties / forces) * 100)}%`;
  };

  return (
    <Motion.div
      className="chart-container battle-comparison"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      role="region"
      aria-label="Battle Comparison Tool"
    >
      <div className="comparison-header" style={{ marginBottom: '1.5rem' }}>
        <h3 className="chart-title">Detailed Battle Analysis</h3>
        <p className="chart-takeaway" style={{ marginBottom: '1rem' }}>
          Click a row in the chart, or choose an engagement here, to compare forces and casualties.
        </p>
        
        <div className="custom-select-wrapper">
          <select
            className="battle-select"
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            aria-label="Select a battle to compare"
          >
            {battles.map(b => (
              <option key={b.id} value={b.id}>{b.title} ({b.year})</option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <Motion.div
          key={selected.id}
          className="comparison-content"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <div className="comparison-battle-meta" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div 
              className="outcome-badge" 
              style={{
                background: outcome?.bg,
                color: outcome?.fg,
                marginBottom: '0.5rem',
                display: 'inline-block'
              }}
            >
              {selected.outcomeLabel || outcomeLabelFor(selected.outcome)}
            </div>
            <p className="comparison-meta-line">
              {selected.location} • {new Date(selected.date).toLocaleDateString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC'
              })}
            </p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-side american">
              <h4>{selected.combatants?.american || 'American / allied'}</h4>
              <div className="comparison-stat">
                <span className="comparison-label">Total Forces</span>
                <AnimatedCounter value={selected.forces.american} className="comparison-value" duration={0.8} />
              </div>
              <div className="comparison-stat">
                <span className="comparison-label">Casualties</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
                  <AnimatedCounter value={selected.casualties.american} className="comparison-value casualty" duration={0.8} />
                  <span className="comparison-rate">({calculateRate(selected.casualties.american, selected.forces.american)})</span>
                </div>
              </div>
              <div className="comparison-bar">
                <Motion.div
                  className="bar-fill"
                  style={{ background: americanBar }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(selected.forces.american / Math.max(selected.forces.american, selected.forces.british)) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="comparison-vs">
              <span>VS</span>
            </div>

            <div className="comparison-side british">
              <h4>{selected.combatants?.british || 'Crown / allied'}</h4>
              <div className="comparison-stat">
                <span className="comparison-label">Total Forces</span>
                <AnimatedCounter value={selected.forces.british} className="comparison-value" duration={0.8} />
              </div>
              <div className="comparison-stat">
                <span className="comparison-label">Casualties</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
                  <AnimatedCounter value={selected.casualties.british} className="comparison-value casualty" duration={0.8} />
                  <span className="comparison-rate">({calculateRate(selected.casualties.british, selected.forces.british)})</span>
                </div>
              </div>
              <div className="comparison-bar">
                <Motion.div
                  className="bar-fill"
                  style={{ background: britishBar }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(selected.forces.british / Math.max(selected.forces.american, selected.forces.british)) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
          
          <div className="comparison-significance" style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.03)', 
            borderRadius: '8px',
            fontSize: '0.85rem',
            lineHeight: '1.5',
            color: darkMode ? '#ccc' : '#444',
            fontStyle: 'italic',
            textAlign: 'center'
          }}>
            {selected.description}
          </div>
          {selected.statNote && (
            <p className="comparison-stat-note">
              <strong>Reading the numbers:</strong> {selected.statNote}
            </p>
          )}
          <div className="comparison-actions">
            {onOpenStory && (
              <button
                type="button"
                className="comparison-open-story"
                onClick={() => onOpenStory(selected.id)}
              >
                Open in the story
              </button>
            )}
            {selected.source && (
              <a
                className="comparison-source"
                href={selected.source.url}
                target="_blank"
                rel="noreferrer"
              >
                Source: {selected.source.label} ↗
              </a>
            )}
          </div>
        </Motion.div>
      </AnimatePresence>
    </Motion.div>
  );
}
