import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: darkMode ? 'rgba(22, 27, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        backdropFilter: 'blur(8px)',
        padding: '12px 16px',
        fontFamily: 'var(--font-body)',
        borderRadius: '8px',
        fontSize: '13px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <p style={{
          margin: '0 0 8px 0',
          fontWeight: 'bold',
          color: darkMode ? '#E6EDF5' : '#0A244A'
        }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{
            margin: '4px 0',
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

export function ArmyChart({ data, activeYear, darkMode }) {
  const textColor = darkMode ? '#8B949E' : '#4A5568';

  return (
    <motion.div
      className="chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="chart-title">Troop Strength Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.3 }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fontSize: 11, fill: textColor }}
            tickFormatter={(value) => `${value / 1000}k`}
            axisLine={{ stroke: textColor, strokeOpacity: 0.3 }}
          />
          <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="continental"
            name="Continental Army"
            stroke="#0A244A"
            fill="url(#colorContinental)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="british"
            name="British Army"
            stroke="#7A1212"
            fill="url(#colorBritish)"
            strokeWidth={2}
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
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="chart-title">Colonial Trade (£ millions)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="year"
            stroke={textColor}
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.3 }}
          />
          <YAxis
            stroke={textColor}
            tick={{ fontSize: 11, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.3 }}
          />
          <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="colonialExports"
            name="Exports"
            stroke="#0A244A"
            strokeWidth={2}
            dot={{ fill: '#0A244A', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="colonialImports"
            name="Imports from Britain"
            stroke="#7A1212"
            strokeWidth={2}
            dot={{ fill: '#7A1212', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
