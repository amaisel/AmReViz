import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

export default function BattleComparison({ battles, darkMode }) {
  const [selectedId, setSelectedId] = useState(battles[0]?.id);
  const selected = battles.find(b => b.id === selectedId) || battles[0];

  if (!selected) return null;

  const outcomeLabel = {
    american: 'American Victory',
    british: 'British Victory',
    indecisive: 'Indecisive'
  };

  const outcomeColor = {
    american: '#0A244A',
    british: '#7A1212',
    indecisive: '#C5A02F'
  };

  const calculateRate = (casualties, forces) => {
    if (!forces) return '0%';
    return `${Math.round((casualties / forces) * 100)}%`;
  };

  return (
    <motion.div
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
          Compare the forces and casualties of pivotal engagements.
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
        <motion.div
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
                background: outcomeColor[selected.outcome], 
                color: 'white',
                marginBottom: '0.5rem',
                display: 'inline-block'
              }}
            >
              {outcomeLabel[selected.outcome]}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888' }}>
              {selected.location} • {new Date(selected.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-side american">
              <h4>Continental Army</h4>
              <div className="comparison-stat">
                <span className="comparison-label">Total Forces</span>
                <AnimatedCounter value={selected.forces.american} className="comparison-value" duration={0.8} />
              </div>
              <div className="comparison-stat">
                <span className="comparison-label">Casualties</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
                  <AnimatedCounter value={selected.casualties.american} className="comparison-value casualty" duration={0.8} />
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>({calculateRate(selected.casualties.american, selected.forces.american)})</span>
                </div>
              </div>
              <div className="comparison-bar">
                <motion.div
                  className="bar-fill"
                  style={{ background: '#0A244A' }}
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
              <h4>British Forces</h4>
              <div className="comparison-stat">
                <span className="comparison-label">Total Forces</span>
                <AnimatedCounter value={selected.forces.british} className="comparison-value" duration={0.8} />
              </div>
              <div className="comparison-stat">
                <span className="comparison-label">Casualties</span>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px' }}>
                  <AnimatedCounter value={selected.casualties.british} className="comparison-value casualty" duration={0.8} />
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>({calculateRate(selected.casualties.british, selected.forces.british)})</span>
                </div>
              </div>
              <div className="comparison-bar">
                <motion.div
                  className="bar-fill"
                  style={{ background: '#7A1212' }}
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
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
