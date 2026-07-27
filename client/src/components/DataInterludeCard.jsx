import { useMemo } from 'react';
import { ArmyChart, TradeChart, CasualtiesChart, CampaignTimeline } from './Charts';
import { armyData, economicData, battleData, campaignData } from '../data/events';

function InterludeChart({ interlude, darkMode, onBattleClick }) {
  const { chart, yearCutoff } = interlude;

  const slicedBattles = useMemo(
    () => battleData.filter(b => b.year <= yearCutoff),
    [yearCutoff]
  );
  const slicedArmy = useMemo(
    () => armyData.filter(d => d.year <= yearCutoff),
    [yearCutoff]
  );
  const slicedTrade = useMemo(
    () => economicData.filter(d => d.year <= yearCutoff),
    [yearCutoff]
  );

  switch (chart) {
    case 'casualties':
      return <CasualtiesChart data={slicedBattles} darkMode={darkMode} onBattleClick={onBattleClick} compact />;
    case 'trade':
      return <TradeChart data={slicedTrade} darkMode={darkMode} compact />;
    case 'army':
      return <ArmyChart data={slicedArmy} darkMode={darkMode} compact />;
    case 'fullLedger':
      return (
        <>
          <CasualtiesChart data={slicedBattles} darkMode={darkMode} onBattleClick={onBattleClick} compact />
          <CampaignTimeline data={campaignData} darkMode={darkMode} compact />
        </>
      );
    default:
      return null;
  }
}

export default function DataInterludeCard({
  interlude,
  darkMode,
  timelineOpen,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onBattleClick,
}) {
  if (!interlude) return null;

  return (
    <div className={`event-card-fixed data-interlude-card ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-open' : ''}`}>
      <div className="event-card-topline">
        <div className="event-card-type-badge interlude-badge">
          Data Dispatch
        </div>
        <span className="event-card-date-inline">Through {interlude.yearCutoff}</span>
      </div>

      <h2 className="event-card-title">{interlude.title}</h2>

      <p className="event-card-description">{interlude.takeaway}</p>

      <div className="interlude-chart-wrap">
        <InterludeChart interlude={interlude} darkMode={darkMode} onBattleClick={onBattleClick} />
      </div>

      {(onPrev || onNext) && (
        <div className="event-card-nav">
          <button
            className="event-card-nav-btn"
            onClick={onPrev}
            disabled={!hasPrev}
            aria-label="Previous"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="10 12 6 8 10 4"/>
            </svg>
            Prev
          </button>
          <button
            className="event-card-nav-btn"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next"
          >
            Next
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 4 10 8 6 12"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
