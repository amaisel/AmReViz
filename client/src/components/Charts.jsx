import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';
import { motion as Motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: darkMode ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
        backdropFilter: 'blur(8px)',
        padding: '10px 14px',
        fontFamily: 'var(--font-body)',
        borderRadius: '8px',
        fontSize: '13px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <p style={{
          margin: '0 0 6px 0',
          fontWeight: 'bold',
          color: darkMode ? '#E6EDF5' : '#0A244A'
        }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{
            margin: '3px 0',
            color: entry.color
          }}>
            {entry.name}: {typeof entry.value === 'number'
              ? entry.value.toLocaleString(undefined, entry.value < 100
                ? { maximumFractionDigits: 3 }
                : undefined)
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartSource = ({ source, note }) => (
  <div className="chart-source-row">
    {note && <span>{note}</span>}
    {source && (
      <a className="chart-source" href={source.url} target="_blank" rel="noreferrer">
        Source: {source.label} ↗
      </a>
    )}
  </div>
);

export function ArmyChart({ data, darkMode, onYearClick, source, compact = false }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      role="region"
      aria-label="American Troops Furnished by Year Chart"
    >
      {!compact && (
        <>
          <h3 className="chart-title">American Troops Furnished by Year</h3>
          <p className="chart-takeaway">
            These annual service totals are higher than the army present at any one time because
            short enlistments, militia tours, and reenlistments could count the same person again.
            Click a year to open it in the story.
          </p>
        </>
      )}
      <ResponsiveContainer
        width="100%"
        height={compact ? 200 : 280}
        minWidth={0}
        initialDimension={{ width: 320, height: compact ? 200 : 280 }}
      >
        {/* The click handler belongs on the chart, not on the two <Area>s.
            Recharts 3 fires an Area's onClick for the filled shape only — not
            for the dots the `cursor: pointer` was advertising — so a click on
            a year's marker reached nothing at all. On the chart it also means
            the whole column is the target, rather than an 11px dot. */}
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          onClick={(state) => {
            const index = Number(state?.activeIndex);
            const datum = Number.isInteger(index) ? data[index] : undefined;
            if (datum?.year != null) onYearClick?.(datum.year);
          }}
          style={onYearClick ? { cursor: 'pointer' } : undefined}
        >
          <defs>
            <linearGradient id="colorContinental" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0A244A" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0A244A" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorMilitia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C5A02F" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#C5A02F" stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={{ value: 'Year', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: textColor }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => `${value / 1000}k`}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={{ value: 'Troops furnished', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
          />
          <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
          <ReferenceLine 
            x={1778} 
            stroke={darkMode ? '#C5A02F' : '#0A244A'} 
            strokeDasharray="3 3" 
            label={{ 
              value: 'Valley Forge', 
              position: 'top', 
              fontSize: 11, 
              fill: darkMode ? '#C5A02F' : '#0A244A',
              fontWeight: 600
            }} 
          />
          <Area
            type="monotone"
            dataKey="continentalPay"
            name="In Continental pay"
            stroke="#0A244A"
            fill="url(#colorContinental)"
            strokeWidth={3}
            stackId="troops"
            dot={{ fill: '#0A244A', r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
          <Area
            type="monotone"
            dataKey="militia"
            name="Militia & short-term troops"
            stroke="#C5A02F"
            fill="url(#colorMilitia)"
            strokeWidth={3}
            stackId="troops"
            dot={{ fill: '#C5A02F', r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      {!compact && (
        <ChartSource
          source={source}
          note="Militia records are fragmentary; the source labels part of this series conjectural."
        />
      )}
    </Motion.div>
  );
}

export function TradeChart({ data, darkMode, source, compact = false }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';
  const peakImports = data.find(entry => entry.year === 1771)?.colonialImports ?? 0;
  const finalImports = data.find(entry => entry.year === 1776)?.colonialImports ?? 0;
  const importDrop = peakImports
    ? ((1 - finalImports / peakImports) * 100).toFixed(1)
    : '0.0';

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: compact ? 0 : 0.15 }}
      role="region"
      aria-label="Colonial Trade Chart"
    >
      {!compact && (
        <>
          <h3 className="chart-title">Colonial Trade Impact</h3>
          <p className="chart-takeaway">
            Recorded imports from England fell {importDrop}% between 1771 and 1776 as boycotts and
            war severed trade. Official customs values in millions of pounds sterling (£).
          </p>
        </>
      )}
      <ResponsiveContainer
        width="100%"
        height={compact ? 200 : 280}
        minWidth={0}
        initialDimension={{ width: 320, height: compact ? 200 : 280 }}
      >
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="year"
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={{ value: 'Value (£m)', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
          />
          <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
          <ReferenceLine 
            x={1775} 
            stroke={darkMode ? '#8B949E' : '#666'} 
            strokeDasharray="3 3" 
            label={{ 
              value: 'War Begins', 
              position: 'top', 
              fontSize: 11, 
              fill: textColor,
              fontWeight: 600
            }} 
          />
          <Line
            type="monotone"
            dataKey="colonialExports"
            name="Exports to England"
            stroke="#0A244A"
            strokeWidth={3}
            dot={{ fill: '#0A244A', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="colonialImports"
            name="Imports from England"
            stroke="#7A1212"
            strokeWidth={3}
            dot={{ fill: '#7A1212', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      {!compact && (
        <ChartSource
          source={source}
          note="The Census recommends these official values as a relative trade index, not current market values."
        />
      )}
    </Motion.div>
  );
}

export function CasualtiesChart({ data, darkMode, onBattleClick, compact = false }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: compact ? 0 : 0.25 }}
      role="region"
      aria-label="Casualties by Major Battle Chart"
    >
      {!compact && (
        <>
          <h3 className="chart-title">Casualties by Major Battle</h3>
          <p className="chart-takeaway">
            These selected engagements mix killed, wounded, missing, and captured; they must not
            be added to estimate total war deaths. Click a bar to inspect its definition.
          </p>
        </>
      )}
      <div
        className="chart-scroll-frame"
        tabIndex={0}
        aria-label="Scrollable chronological battle casualty chart"
      >
        <div
          style={{
            minWidth: `${compact ? Math.max(360, data.length * 80) : Math.max(900, data.length * 88)}px`,
            height: compact ? '240px' : '340px'
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: compact ? 360 : 900, height: compact ? 240 : 340 }}
          >
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 70 }}
              // Recharts 3 dropped `activePayload` from the chart-level click
              // state — it now reports `activeIndex` and `activeLabel` only.
              // The old guard read `state.activePayload[0].payload.id`, never
              // matched, and left the chart's own instruction ("Click a bar to
              // inspect its definition") pointing at nothing.
              onClick={(state) => {
                const index = Number(state?.activeIndex);
                const datum = Number.isInteger(index) ? data[index] : undefined;
                if (datum?.id != null) onBattleClick?.(datum.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis
                dataKey="title"
                stroke={textColor}
                tick={{ fontSize: 11, fill: textColor, angle: -45, textAnchor: 'end' }}
                interval={0}
                height={90}
                axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
              />
              <YAxis
                stroke={textColor}
                tick={{ fontSize: 12, fill: textColor }}
                axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
                tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
                label={{ value: 'Estimated casualties', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
              />
              <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
              <Bar dataKey="americanCasualties" name="American / allied" fill="#0A244A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="britishCasualties" name="Crown / allied" fill="#7A1212" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Motion.div>
  );
}

export function CampaignTimeline({ data, darkMode, compact = false }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';
  const baseDate = Date.UTC(1775, 0, 1);
  const dayMs = 86400000;

  const regionColors = { north: '#0A244A', mid: '#C5A02F', south: '#7A1212' };

  const chartData = data.map(c => {
    const startDays = Math.round((new Date(c.start).getTime() - baseDate) / dayMs);
    const durationDays = Math.round((new Date(c.end).getTime() - new Date(c.start).getTime()) / dayMs);
    return {
      name: c.name,
      start: startDays,
      duration: durationDays,
      region: c.region,
      startDate: c.start,
      endDate: c.end
    };
  });

  const formatDayOffset = (dayOffset) => {
    const d = new Date(baseDate + dayOffset * dayMs);
    return `${d.getUTCFullYear()}`;
  };

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: compact ? 0 : 0.35 }}
      role="region"
      aria-label="Military Campaigns Timeline"
    >
      {!compact && (
        <>
          <h3 className="chart-title">Theater of Operations</h3>
          <p className="chart-takeaway">
            The conflict overlapped across Canada, New England, the Mid-Atlantic, the Gulf,
            and the South before American-French forces converged on Yorktown.
          </p>
        </>
      )}
      <div className="campaign-legend" style={{ marginBottom: '1rem' }}>
        {Object.entries(regionColors).map(([region, color]) => (
          <span key={region} className="campaign-legend-item" style={{ fontSize: '12px' }}>
            <span className="campaign-legend-dot" style={{ background: color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
            {region === 'north' ? 'Northern' : region === 'mid' ? 'Mid-Atlantic' : 'Southern'}
          </span>
        ))}
      </div>
      <ResponsiveContainer
        width="100%"
        height={compact ? 240 : Math.max(300, data.length * 36)}
        minWidth={0}
        initialDimension={{ width: 320, height: compact ? 240 : Math.max(300, data.length * 36) }}
      >
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <XAxis
            type="number"
            tickFormatter={formatDayOffset}
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            domain={[0, 'dataMax']}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={textColor}
            tick={{ fontSize: 11, fill: textColor }}
            width={140}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload?.[1]) {
                const d = payload[1].payload;
                return (
                  <div style={{
                    background: darkMode ? 'rgba(22, 27, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                    backdropFilter: 'blur(8px)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: darkMode ? '#E6EDF5' : '#0A244A' }}>{d.name}</p>
                    <p style={{ margin: '2px 0', color: textColor }}>
                      {new Date(d.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' })} to{' '}
                      {new Date(d.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
                    </p>
                    <p style={{ margin: '2px 0', color: textColor }}>{d.duration} days</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="start" stackId="a" fill="transparent" />
          <Bar dataKey="duration" stackId="a" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={regionColors[entry.region]} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {!compact && (
        <ChartSource note="Campaign boundaries are interpretive ranges for the selected operations, not a count of continuous fighting." />
      )}
    </Motion.div>
  );
}
