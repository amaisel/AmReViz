import { AnimatePresence, motion as Motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import AnimatedCounter from './AnimatedCounter';

const outcomeLabel = {
  american: 'American victory',
  british: 'British victory',
  indecisive: 'Indecisive',
};

function ForceColumn({ label, forces, casualties, side }) {
  const casualtyRate = Math.round((casualties / forces) * 100);
  return (
    <div className={`comparison-side ${side}`}>
      <h5>{label}</h5>
      <dl>
        <div>
          <dt>Forces</dt>
          <dd><AnimatedCounter value={forces} /></dd>
        </div>
        <div>
          <dt>Casualties</dt>
          <dd><AnimatedCounter value={casualties} /></dd>
        </div>
      </dl>
      <div className="loss-rate">
        <span><i style={{ width: `${casualtyRate}%` }} /></span>
        <strong>{casualtyRate}% of force</strong>
      </div>
    </div>
  );
}

export default function BattleComparison({ battles }) {
  const [selectedId, setSelectedId] = useState(battles[0]?.id);
  const reduceMotion = useReducedMotion();
  const selected = battles.find(battle => battle.id === selectedId) || battles[0];
  if (!selected) return null;

  return (
    <Motion.figure
      className="chart-container battle-comparison"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
    >
      <figcaption className="chart-header">
        <div className="chart-furniture"><span>FIG. 05</span><span>Battle profile</span></div>
        <h4 className="chart-title">Losses mattered in proportion, not just in number</h4>
        <p className="chart-takeaway">
          Select an engagement to compare each army’s starting strength with the share lost.
        </p>
      </figcaption>

      <label className="battle-select-label" htmlFor="battle-select">Engagement</label>
      <select
        id="battle-select"
        className="battle-select"
        value={selectedId}
        onChange={event => setSelectedId(Number(event.target.value))}
      >
        {battles.map(battle => (
          <option key={battle.id} value={battle.id}>{battle.title} ({battle.year})</option>
        ))}
      </select>

      <AnimatePresence mode="wait">
        <Motion.div
          key={selected.id}
          className="comparison-content"
          initial={reduceMotion ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
          transition={{ duration: 0.22 }}
        >
          <div className="comparison-battle-meta">
            <span className={`outcome-badge outcome-${selected.outcome}`}>{outcomeLabel[selected.outcome]}</span>
            <span>{selected.location.replace('\n', ', ')}</span>
          </div>
          <div className="comparison-grid">
            <ForceColumn
              label="American"
              forces={selected.forces.american}
              casualties={selected.casualties.american}
              side="american"
            />
            <div className="comparison-vs" aria-hidden="true">vs.</div>
            <ForceColumn
              label="British"
              forces={selected.forces.british}
              casualties={selected.casualties.british}
              side="british"
            />
          </div>
          <blockquote>{selected.significance}</blockquote>
        </Motion.div>
      </AnimatePresence>

      <footer className="chart-footer">
        <p><strong>Source:</strong> American Battlefield Trust estimates.</p>
      </footer>
    </Motion.figure>
  );
}
