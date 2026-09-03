import { useState } from 'react';
import { ArmyChart, TradeChart, CasualtiesChart, CampaignTimeline } from './Charts';
import BattleComparison from './BattleComparison';
import AnimatedCounter from './AnimatedCounter';
import {
  armyData,
  economicData,
  battleData,
  campaignData,
  warSummaryData,
  aggregateSources,
} from '../data/metrics';
import { events } from '../data/events';

export default function DataView({ darkMode, onNavigateToEvent }) {
  const battles = events.filter(event => event.casualties && event.forces);
  const battleCount = events.filter(event => event.type === 'battle').length;
  const [focusedBattleId, setFocusedBattleId] = useState(battles[0]?.id);

  const handleYearClick = (year) => {
    const match = events.find(event => event.year === year);
    if (match) onNavigateToEvent?.(match.id);
  };

  return (
    <div className="data-view">
      <header className="data-section">
        <h2>War in Numbers</h2>
        <p className="data-subtitle">
          {events.length} source-linked events, including {battleCount} battles and sieges
        </p>
      </header>

      {/* h3, not h4: these sit directly under the h2 above, and jumping a
          level leaves a screen reader's heading outline with a hole in it. */}
      <div className="data-insights">
        <div className="insight-card">
          <h3>U.S. Servicemembers</h3>
          <AnimatedCounter value={warSummaryData.servicemembers} className="insight-value" />
          <p>
            median of an estimated {warSummaryData.serviceEstimateRange[0].toLocaleString()}–
            {warSummaryData.serviceEstimateRange[1].toLocaleString()} who served
          </p>
        </div>
        <div className="insight-card">
          <h3>Recorded Battle Deaths</h3>
          <AnimatedCounter value={warSummaryData.battleDeaths} className="insight-value" />
          <p>official U.S. series based on incomplete returns</p>
        </div>
        <div className="insight-card">
          <h3>Non-mortal Woundings</h3>
          <AnimatedCounter value={warSummaryData.nonMortalWoundings} className="insight-value" />
          <p>U.S. servicemembers in the same official series</p>
        </div>
      </div>

      <aside className="data-method-note">
        <strong>How to read the estimates</strong>
        <p>
          {warSummaryData.note} The war-wide figures above are not calculated by adding the
          selected engagements below.
        </p>
        <p>
          Battle casualties can include killed, wounded, missing, and captured. “American / allied”
          and “Crown / allied” are comparison columns, not claims that every combatant was American
          or British; the story cards identify French, Hessian, Loyalist, Indigenous, and Spanish-led
          forces where the record supports it.
        </p>
        <div className="data-method-links">
          <a href={warSummaryData.source.url} target="_blank" rel="noreferrer">
            War-wide U.S. figures ↗
          </a>
          <a href={aggregateSources.americanManpower.url} target="_blank" rel="noreferrer">
            Annual manpower ↗
          </a>
          <a href={aggregateSources.englandTrade.url} target="_blank" rel="noreferrer">
            Colonial trade ↗
          </a>
          <a
            href="https://www.battlefields.org/learn/revolutionary-war/battles"
            target="_blank"
            rel="noreferrer"
          >
            Battle estimates ↗
          </a>
          <a
            href="https://www.nps.gov/subjects/americanrevolution/timeline.htm"
            target="_blank"
            rel="noreferrer"
          >
            Chronology ↗
          </a>
        </div>
      </aside>

      <section className="data-group">
        <h3 className="data-group-title">Military Strength & Theater</h3>
        <div className="data-stack data-stack--shared-time">
          <ArmyChart
            data={armyData}
            darkMode={darkMode}
            onYearClick={handleYearClick}
            source={aggregateSources.americanManpower}
            sharedTimeAxis
          />
          <CampaignTimeline data={campaignData} darkMode={darkMode} sharedTimeAxis />
        </div>
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Economic Impact</h3>
        <TradeChart
          data={economicData}
          darkMode={darkMode}
          source={aggregateSources.englandTrade}
        />
      </section>

      <section className="data-group">
        <h3 className="data-group-title">Battle Analysis</h3>
        <div className="data-stack">
          <CasualtiesChart
            data={battleData}
            darkMode={darkMode}
            selectedBattleId={focusedBattleId}
            onBattleSelect={setFocusedBattleId}
          />
          <BattleComparison
            battles={battles}
            darkMode={darkMode}
            selectedId={focusedBattleId}
            onSelect={setFocusedBattleId}
            onOpenStory={onNavigateToEvent}
          />
        </div>
      </section>
    </div>
  );
}
