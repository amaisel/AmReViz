import { ArmyChart, TradeChart, CasualtiesChart, CampaignTimeline } from './Charts';
import BattleComparison from './BattleComparison';
import AnimatedCounter from './AnimatedCounter';
import {
  events,
  armyData,
  economicData,
  battleData,
  campaignData,
} from '../data/events';

export default function DataView({ darkMode, onNavigateToEvent }) {
  const battles = events.filter(event => event.casualties);

  const handleBattleClick = (eventId) => {
    onNavigateToEvent?.(eventId);
  };

  const handleYearClick = (year) => {
    const match = events.find(event => event.year === year);
    if (match) onNavigateToEvent?.(match.id);
  };

  return (
    <div className="data-view">
      <header className="data-section">
        <h2>Forces & Economy</h2>
        <p className="data-subtitle">
          Visualizing the Revolution through numbers
        </p>
      </header>

      <div className="data-insights">
        <div className="insight-card">
          <h4>Peak Continental Army</h4>
          <AnimatedCounter value={35000} className="insight-value" />
          <p>troops in 1778 after Valley Forge training</p>
        </div>
        <div className="insight-card">
          <h4>Trade Collapse</h4>
          <AnimatedCounter value={75} prefix="-" suffix="%" className="insight-value" />
          <p>drop in British imports 1774-1776</p>
        </div>
        <div className="insight-card">
          <h4>War Deaths</h4>
          <AnimatedCounter value={25000} className="insight-value" />
          <p>American casualties (combat + disease)</p>
        </div>
      </div>

      <section className="data-group">
        <h3 className="data-group-title">Military Strength & Theater</h3>
        <div className="data-grid">
          <ArmyChart data={armyData} darkMode={darkMode} onYearClick={handleYearClick} />
          <CampaignTimeline data={campaignData} darkMode={darkMode} />
        </div>
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Economic Impact</h3>
        <TradeChart data={economicData} darkMode={darkMode} />
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Battle Analysis</h3>
        <div className="data-grid">
          <CasualtiesChart data={battleData} darkMode={darkMode} onBattleClick={handleBattleClick} />
          <BattleComparison battles={battles} darkMode={darkMode} />
        </div>
      </section>
    </div>
  );
}
