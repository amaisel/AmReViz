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
import { motion } from 'framer-motion';

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
              ? entry.value.toLocaleString()
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ArmyChart({ data, darkMode, onYearClick }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      role="region"
      aria-label="Troop Strength Over Time Chart"
    >
      <h3 className="chart-title">Troop Strength Over Time</h3>
      <p className="chart-takeaway">
        The Continental Army peaked at 35,000 after Valley Forge training in 1778, while British forces
        remained relatively stable before declining after Yorktown.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorContinental" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0A244A" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0A244A" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorBritish" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7A1212" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#7A1212" stopOpacity={0.1} />
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
            label={{ value: 'Troops', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
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
            dataKey="continental"
            name="Continental Army"
            stroke="#0A244A"
            fill="url(#colorContinental)"
            strokeWidth={3}
            dot={{ fill: '#0A244A', r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
            onClick={(data) => onYearClick?.(data?.year)}
          />
          <Area
            type="monotone"
            dataKey="british"
            name="British Army"
            stroke="#7A1212"
            fill="url(#colorBritish)"
            strokeWidth={3}
            dot={{ fill: '#7A1212', r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function TradeChart({ data, darkMode }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      role="region"
      aria-label="Colonial Trade Chart"
    >
      <h3 className="chart-title">Colonial Trade Impact</h3>
      <p className="chart-takeaway">
        British imports collapsed by 97% between 1771 and 1776 as boycotts and war
        severed trade. Values in millions of British Pounds Sterling (£).
      </p>
      <ResponsiveContainer width="100%" height={280}>
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
            name="Colonial Exports"
            stroke="#0A244A"
            strokeWidth={3}
            dot={{ fill: '#0A244A', r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="colonialImports"
            name="Imports from Britain"
            stroke="#7A1212"
            strokeWidth={3}
            dot={{ fill: '#7A1212', r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function CasualtiesChart({ data, darkMode, onBattleClick }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      role="region"
      aria-label="Casualties by Major Battle Chart"
    >
      <h3 className="chart-title">Casualties by Major Battle</h3>
      <p className="chart-takeaway">
        Long Island was the deadliest engagement for Americans,
        while Bunker Hill cost the British nearly half their force.
        Click a bar to view the battle on the map.
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
          onClick={(state) => {
            if (state?.activePayload?.[0]?.payload?.id) {
              onBattleClick?.(state.activePayload[0].payload.id);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <XAxis
            dataKey="title"
            stroke={textColor}
            tick={{ fontSize: 11, fill: textColor, angle: -45, textAnchor: 'end' }}
            interval={0}
            height={80}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={{ value: 'Casualties', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
          />
          <Tooltip content={<CustomTooltip darkMode={darkMode} />} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
          <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }} />
          <Bar dataKey="americanCasualties" name="American" fill="#0A244A" radius={[4, 4, 0, 0]} />
          <Bar dataKey="britishCasualties" name="British" fill="#7A1212" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function CampaignTimeline({ data, darkMode }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';
  const baseDate = new Date('1775-01-01').getTime();
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
    return `${d.getFullYear()}`;
  };

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      role="region"
      aria-label="Military Campaigns Timeline"
    >
      <h3 className="chart-title">Theater of Operations</h3>
      <p className="chart-takeaway">
        The war's focus shifted from New England (1775) through the
        Mid-Atlantic (1776–78) to the decisive Southern theater (1780–81).
      </p>
      <div className="campaign-legend" style={{ marginBottom: '1rem' }}>
        {Object.entries(regionColors).map(([region, color]) => (
          <span key={region} className="campaign-legend-item" style={{ fontSize: '12px' }}>
            <span className="campaign-legend-dot" style={{ background: color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
            {region === 'north' ? 'Northern' : region === 'mid' ? 'Mid-Atlantic' : 'Southern'}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
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
                    <p style={{ margin: '2px 0', color: textColor }}>{new Date(d.startDate).toLocaleDateString()} to {new Date(d.endDate).toLocaleDateString()}</p>
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
    </motion.div>
  );
}
