import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion as Motion, useReducedMotion } from 'framer-motion';

const COLORS = {
  american: '#163d67',
  british: '#9e2a2b',
  gold: '#b08728',
  green: '#4f6b55',
};

function GraphicFrame({ number, eyebrow, title, takeaway, source, className = '', children, table }) {
  const reduceMotion = useReducedMotion();
  return (
    <Motion.figure
      className={`chart-container ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <figcaption className="chart-header">
        <div className="chart-furniture">
          <span>FIG. {number}</span>
          <span>{eyebrow}</span>
        </div>
        <h4 className="chart-title">{title}</h4>
        <p className="chart-takeaway">{takeaway}</p>
      </figcaption>
      <div className="chart-plot">{children}</div>
      <footer className="chart-footer">
        <p><strong>Source:</strong> {source}</p>
        {table}
      </footer>
    </Motion.figure>
  );
}

function DataTable({ label, columns, rows }) {
  return (
    <details className="data-table-disclosure">
      <summary>View data table</summary>
      <div className="data-table-scroll">
        <table>
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>{columns.map(column => <th key={column.key} scope="col">{column.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? row.year ?? row.name ?? index}>
                {columns.map((column, columnIndex) => (
                  columnIndex === 0
                    ? <th key={column.key} scope="row">{row[column.key]}</th>
                    : <td key={column.key}>{typeof row[column.key] === 'number' ? row[column.key].toLocaleString() : row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function ChartTooltip({ active, payload, label, darkMode, valueSuffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`chart-tooltip ${darkMode ? 'dark' : ''}`}>
      <strong>{label}</strong>
      {payload
        .filter(entry => entry.value != null)
        .map(entry => (
          <span key={entry.dataKey} style={{ '--series-color': entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}{valueSuffix}
          </span>
        ))}
    </div>
  );
}

function GraphicKey({ items }) {
  return (
    <div className="graphic-key" aria-label="Chart key">
      {items.map(item => (
        <span key={item.label}>
          <i style={{ '--key-color': item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ArmyChart({ data, darkMode, onYearClick }) {
  const textColor = darkMode ? '#b6b2a8' : '#5c5a54';
  return (
    <GraphicFrame
      number="01"
      eyebrow="Force strength, 1775–1783"
      title="The Continental Army peaked only after its hardest winter"
      takeaway="American strength recovered sharply in 1777–78, briefly matching the British force before both armies contracted toward war’s end."
      source="Rounded historical force estimates compiled for this project."
      className="chart-wide"
      table={
        <DataTable
          label="Troop strength by year"
          columns={[
            { key: 'year', label: 'Year' },
            { key: 'continental', label: 'Continental' },
            { key: 'british', label: 'British' },
            { key: 'militia', label: 'Militia' },
          ]}
          rows={data}
        />
      }
    >
      <GraphicKey items={[
        { label: 'Continental Army', color: COLORS.american },
        { label: 'British Army', color: COLORS.british },
        { label: 'Militia', color: COLORS.green },
      ]} />
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 12 }}>
          <defs>
            <linearGradient id="continentalArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.american} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COLORS.american} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 12 }} tickLine={false} axisLine={{ stroke: textColor, strokeOpacity: 0.25 }} />
          <YAxis width={48} tickFormatter={value => `${value / 1000}k`} tick={{ fill: textColor, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip darkMode={darkMode} />} />
          <ReferenceLine
            x={1778}
            stroke={COLORS.gold}
            strokeDasharray="3 4"
            label={{ value: 'After Valley Forge', fill: textColor, fontSize: 11, position: 'top' }}
          />
          <Area
            type="monotone"
            dataKey="continental"
            name="Continental"
            stroke={COLORS.american}
            fill="url(#continentalArea)"
            strokeWidth={3}
            activeDot={{ r: 6, onClick: (_event, payload) => onYearClick?.(payload?.payload?.year) }}
          />
          <Line type="monotone" dataKey="british" name="British" stroke={COLORS.british} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="militia" name="Militia" stroke={COLORS.green} strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="chart-annotation"><span>1778</span> Training at Valley Forge preceded the army’s high point.</p>
    </GraphicFrame>
  );
}

export function TradeChart({ data, darkMode }) {
  const textColor = darkMode ? '#b6b2a8' : '#5c5a54';
  const baseline = data.find(item => item.year === 1771);
  const indexed = data.map(item => ({
    ...item,
    exportsIndex: Math.round((item.colonialExports / baseline.colonialExports) * 100),
    importsIndex: Math.round((item.colonialImports / baseline.colonialImports) * 100),
  }));

  return (
    <GraphicFrame
      number="03"
      eyebrow="Trade index, 1771 = 100"
      title="Imports from Britain nearly disappeared within five years"
      takeaway="Indexing both series to their 1771 levels reveals the rupture more clearly than nominal values: imports fell to just 2 percent of their peak by 1776."
      source="Historical trade values in millions of pounds sterling; index calculated from the project dataset."
      className="chart-wide"
      table={
        <DataTable
          label="Colonial trade index"
          columns={[
            { key: 'year', label: 'Year' },
            { key: 'exportsIndex', label: 'Exports index' },
            { key: 'importsIndex', label: 'Imports index' },
          ]}
          rows={indexed}
        />
      }
    >
      <GraphicKey items={[
        { label: 'Colonial exports', color: COLORS.american },
        { label: 'Imports from Britain', color: COLORS.british },
      ]} />
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={indexed} margin={{ top: 28, right: 16, left: 0, bottom: 12 }}>
          <XAxis dataKey="year" tick={{ fill: textColor, fontSize: 12 }} tickLine={false} axisLine={{ stroke: textColor, strokeOpacity: 0.25 }} />
          <YAxis width={44} domain={[0, 120]} tick={{ fill: textColor, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTooltip darkMode={darkMode} />} />
          <ReferenceLine y={100} stroke={textColor} strokeOpacity={0.3} strokeDasharray="2 4" />
          <ReferenceLine
            x={1775}
            stroke={COLORS.gold}
            strokeDasharray="3 4"
            label={{ value: 'War begins', fill: textColor, fontSize: 11, position: 'top' }}
          />
          <Line type="monotone" dataKey="exportsIndex" name="Exports index" stroke={COLORS.american} strokeWidth={3} dot={{ r: 3, fill: COLORS.american }} />
          <Line type="monotone" dataKey="importsIndex" name="Imports index" stroke={COLORS.british} strokeWidth={3} dot={{ r: 3, fill: COLORS.british }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-annotation danger"><span>−98%</span> British imports, from the 1771 peak to 1776.</p>
    </GraphicFrame>
  );
}

export function CasualtiesChart({ data, onBattleClick }) {
  const maxCasualties = Math.max(...data.flatMap(item => [item.americanCasualties, item.britishCasualties]));
  const tableRows = data.map(item => ({
    ...item,
    americanRate: `${Math.round((item.americanCasualties / item.americanForces) * 100)}%`,
    britishRate: `${Math.round((item.britishCasualties / item.britishForces) * 100)}%`,
  }));

  return (
    <GraphicFrame
      number="04"
      eyebrow="Selected battle casualties"
      title="The heaviest loss depended on which side was counting"
      takeaway="Long Island produced the largest American loss in this selection. At Bunker Hill, British casualties approached half the attacking force."
      source="American Battlefield Trust estimates. Counts combine killed, wounded, missing, and captured where reported."
      table={
        <DataTable
          label="Casualties by battle"
          columns={[
            { key: 'title', label: 'Battle' },
            { key: 'americanCasualties', label: 'American' },
            { key: 'americanRate', label: 'American rate' },
            { key: 'britishCasualties', label: 'British' },
            { key: 'britishRate', label: 'British rate' },
          ]}
          rows={tableRows}
        />
      }
    >
      <GraphicKey items={[
        { label: 'American', color: COLORS.american },
        { label: 'British', color: COLORS.british },
      ]} />
      <div className="casualty-dotplot">
        <div className="dotplot-scale" aria-hidden="true"><span>0</span><span>1,000</span><span>2,000</span></div>
        {tableRows.map(item => (
          <button
            className="dotplot-row"
            key={item.id}
            onClick={() => onBattleClick?.(item.id)}
            aria-label={`${item.title}: ${item.americanCasualties} American casualties and ${item.britishCasualties} British casualties. Open on map.`}
          >
            <span className="dotplot-label">{item.title}<small>{item.year}</small></span>
            <span className="dotplot-series">
              <i className="dot-line american" style={{ '--dot-width': `${(item.americanCasualties / maxCasualties) * 100}%` }}>
                <b>{item.americanCasualties.toLocaleString()}</b>
              </i>
              <i className="dot-line british" style={{ '--dot-width': `${(item.britishCasualties / maxCasualties) * 100}%` }}>
                <b>{item.britishCasualties.toLocaleString()}</b>
              </i>
            </span>
          </button>
        ))}
      </div>
      <p className="chart-interaction-note">Select a battle to locate it on the map.</p>
    </GraphicFrame>
  );
}

export function CampaignTimeline({ data, darkMode }) {
  const textColor = darkMode ? '#b6b2a8' : '#5c5a54';
  const baseDate = new Date('1775-01-01').getTime();
  const dayMs = 86400000;
  const regionColors = { north: COLORS.american, mid: COLORS.gold, south: COLORS.british };
  const chartData = data.map(campaign => ({
    ...campaign,
    startOffset: Math.round((new Date(campaign.start).getTime() - baseDate) / dayMs),
    duration: Math.round((new Date(campaign.end).getTime() - new Date(campaign.start).getTime()) / dayMs),
  }));

  return (
    <GraphicFrame
      number="02"
      eyebrow="Campaign duration and theater"
      title="The center of gravity moved south"
      takeaway="Major operations began in New England, passed through the Mid-Atlantic, and culminated in a compressed southern endgame."
      source="Campaign date ranges compiled from National Park Service and American Battlefield Trust chronologies."
      table={
        <DataTable
          label="Campaign dates"
          columns={[
            { key: 'name', label: 'Campaign' },
            { key: 'start', label: 'Start' },
            { key: 'end', label: 'End' },
            { key: 'region', label: 'Region' },
          ]}
          rows={data}
        />
      }
    >
      <GraphicKey items={[
        { label: 'Northern', color: COLORS.american },
        { label: 'Mid-Atlantic', color: COLORS.gold },
        { label: 'Southern', color: COLORS.british },
      ]} />
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 12, left: 16, bottom: 10 }}>
          <XAxis
            type="number"
            domain={[0, 'dataMax']}
            tickFormatter={offset => new Date(baseDate + offset * dayMs).getFullYear()}
            tick={{ fill: textColor, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: textColor, strokeOpacity: 0.25 }}
          />
          <YAxis type="category" dataKey="name" width={132} tick={{ fill: textColor, fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              const campaign = payload?.find(item => item.dataKey === 'duration')?.payload;
              if (!active || !campaign) return null;
              return (
                <div className={`chart-tooltip ${darkMode ? 'dark' : ''}`}>
                  <strong>{campaign.name}</strong>
                  <span>{campaign.start} → {campaign.end}</span>
                  <span>{campaign.duration.toLocaleString()} days</span>
                </div>
              );
            }}
          />
          <Bar dataKey="startOffset" stackId="campaign" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="duration" stackId="campaign" radius={[0, 3, 3, 0]}>
            {chartData.map(campaign => <Cell key={campaign.name} fill={regionColors[campaign.region]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GraphicFrame>
  );
}
