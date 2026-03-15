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

  return (
    <motion.div
      className="chart-container battle-comparison"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="chart-title">Battle Outcome Comparison</h3>

      <select
        className="battle-select"
        value={selectedId}
        onChange={(e) => setSelectedId(Number(e.target.value))}
      >
        {battles.map(b => (
          <option key={b.id} value={b.id}>{b.title} ({b.year})</option>
        ))}
      </select>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          className="comparison-grid"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="comparison-side american">
            <h4>Continental</h4>
            <div className="comparison-stat">
              <span className="comparison-label">Forces</span>
              <AnimatedCounter value={selected.forces.american} className="comparison-value" duration={0.8} />
            </div>
            <div className="comparison-stat">
              <span className="comparison-label">Casualties</span>
              <AnimatedCounter value={selected.casualties.american} className="comparison-value casualty" duration={0.8} />
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
            <h4>British</h4>
            <div className="comparison-stat">
              <span className="comparison-label">Forces</span>
              <AnimatedCounter value={selected.forces.british} className="comparison-value" duration={0.8} />
            </div>
            <div className="comparison-stat">
              <span className="comparison-label">Casualties</span>
              <AnimatedCounter value={selected.casualties.british} className="comparison-value casualty" duration={0.8} />
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
        </motion.div>
      </AnimatePresence>

      <div
        className="outcome-badge"
        style={{ background: outcomeColor[selected.outcome], color: 'white' }}
      >
        {outcomeLabel[selected.outcome]}
      </div>
    </motion.div>
  );
}
