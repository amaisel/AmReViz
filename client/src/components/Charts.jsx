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
  ReferenceLine,
  Customized,
  usePlotArea,
  useYAxisDomain,
  ZIndexLayer,
  DefaultZIndexes,
} from 'recharts';
import { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { chartSeries, chartInk } from '../constants/palette';
import useReducedMotion from '../hooks/useReducedMotion';

// The entry rise-and-fade, or nothing at all when motion is reduced. The
// charts were the one place that still animated regardless of preference —
// and with everything else at rest, a title mid-fade is what an accessibility
// scan of the data view kept catching.
function entrance(reduceMotion, delay = 0) {
  if (reduceMotion) return { initial: false };
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  };
}

// Legend labels and tooltip rows in body ink, with the series colour carried by
// a swatch beside them.
//
// Recharts paints both in the series colour by default, which is how the gold
// line — perfectly legible as a stroke — ended up as 2.41:1 text in light
// mode, and the navy as 1.15:1 text in dark. Separating the two jobs means the
// series colours only have to satisfy the 3:1 graphic threshold.
const legendLabel = (value, entry, darkMode) => (
  <span style={{ color: chartInk(darkMode).body }}>{value}</span>
);

// A table of the same numbers, for readers who cannot see the chart at all.
// An SVG in a labelled region announces that a chart exists and then offers
// nothing; this is the chart's content.
const ChartTable = ({ caption, columns, rows }) => (
  <table className="sr-only">
    <caption>{caption}</caption>
    <thead>
      <tr>{columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
    </thead>
    <tbody>
      {rows.map((cells) => (
        <tr key={String(cells[0])}>
          <th scope="row">{cells[0]}</th>
          {cells.slice(1).map((cell, i) => <td key={columns[i + 1]}>{cell}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);

const REGION_NAMES = { north: 'Northern', mid: 'Mid-Atlantic', south: 'Southern' };

// Shared chronological scale for the stacked troop curve + campaign bars.
// Both charts plot years as offsets from 1775 so a BarChart (which insists
// on including 0) and an AreaChart share one numeric domain. 7 is the right
// fence — the end of 1781. Army points stop at 1781 (offset 6).
const SHARED_YEAR_ORIGIN = 1775;
const SHARED_AXIS_DOMAIN = [0, 7];
const SHARED_AXIS_TICKS = [0, 1, 2, 3, 4, 5, 6];
const SHARED_TIME_MARGIN = { top: 20, right: 16, left: 4, bottom: 4 };
const SHARED_Y_AXIS_WIDTH = 120;

function utcYearFraction(iso) {
  const date = new Date(iso);
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return year + (date.getTime() - start) / (end - start);
}

function yearToAxis(year) {
  return year - SHARED_YEAR_ORIGIN;
}

function formatYearTick(value) {
  return String(Math.round(value + SHARED_YEAR_ORIGIN));
}

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
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: '3px 0',
            // The row reads in body ink; the swatch carries the series colour.
            // Painting the text itself in the series colour is what made the
            // gold row 2.41:1 and the dark-mode navy row 1.15:1.
            color: darkMode ? '#E6EDF5' : '#1A1A1A'
          }}>
            <span
              aria-hidden="true"
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '2px',
                background: entry.color,
                flexShrink: 0
              }}
            />
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

// A compact chart takes its height from CSS — `--compact-chart-height` — so the
// story panel can scale it with the viewport the way it scales the type; the
// fallback is the fixed height each chart had before. Recharts sizes its
// container from props alone, so the height has to live on a frame around it
// with the chart filling that frame.
function CompactFrame({ compact, fallback, children }) {
  if (!compact) return children;
  return (
    <div className="chart-compact-frame" style={{ height: `var(--compact-chart-height, ${fallback}px)` }}>
      {children}
    </div>
  );
}

export function ArmyChart({
  data,
  darkMode,
  onYearClick,
  source,
  compact = false,
  sharedTimeAxis = false,
}) {
  const ink = chartInk(darkMode);
  const textColor = ink.muted;
  const continental = chartSeries('american', darkMode);
  const militia = chartSeries('militia', darkMode);
  const reduceMotion = useReducedMotion();
  const timeMargin = sharedTimeAxis
    ? SHARED_TIME_MARGIN
    : { top: 20, right: 30, left: 0, bottom: 0 };
  const plotData = sharedTimeAxis
    ? data.map((d) => ({ ...d, axisYear: yearToAxis(d.year) }))
    : data;

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      {...entrance(reduceMotion)}
      role="region"
      aria-label="American Troops Furnished by Year Chart"
    >
      {!compact && (
        <>
          <h3 className="chart-title">American Troops Furnished by Year</h3>
          <p className="chart-takeaway">
            These annual service totals are higher than the army present at any one time because
            short enlistments, militia tours, and reenlistments could count the same person again.
            {sharedTimeAxis
              ? ' The campaign bars below share these years.'
              : ''}
            {' '}Click a year to open it in the story.
          </p>
        </>
      )}
      <CompactFrame compact={compact} fallback={200}>
      <ResponsiveContainer
        width="100%"
        height={compact ? '100%' : 280}
        minWidth={0}
        initialDimension={{ width: 320, height: compact ? 200 : 280 }}
      >
        {/* The click handler belongs on the chart, not on the two <Area>s.
            Recharts 3 fires an Area's onClick for the filled shape only — not
            for the dots the `cursor: pointer` was advertising — so a click on
            a year's marker reached nothing at all. On the chart it also means
            the whole column is the target, rather than an 11px dot. */}
        <AreaChart
          data={plotData}
          margin={timeMargin}
          onClick={(state) => {
            const index = Number(state?.activeIndex);
            const datum = Number.isInteger(index) ? data[index] : undefined;
            if (datum?.year != null) onYearClick?.(datum.year);
          }}
          style={onYearClick ? { cursor: 'pointer' } : undefined}
        >
          <defs>
            <linearGradient id="colorContinental" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={continental.hue} stopOpacity={0.8} />
              <stop offset="95%" stopColor={continental.hue} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorMilitia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={militia.hue} stopOpacity={0.75} />
              <stop offset="95%" stopColor={militia.hue} stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <XAxis
            type={sharedTimeAxis ? 'number' : 'category'}
            dataKey={sharedTimeAxis ? 'axisYear' : 'year'}
            domain={sharedTimeAxis ? SHARED_AXIS_DOMAIN : undefined}
            ticks={sharedTimeAxis ? SHARED_AXIS_TICKS : undefined}
            tickFormatter={sharedTimeAxis ? formatYearTick : undefined}
            allowDecimals={false}
            interval={sharedTimeAxis ? 0 : undefined}
            minTickGap={sharedTimeAxis ? 0 : undefined}
            padding={sharedTimeAxis ? { left: 0, right: 0 } : undefined}
            stroke={textColor}
            tick={{ fontSize: sharedTimeAxis ? 11 : 12, fill: textColor }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={sharedTimeAxis ? undefined : {
              value: 'Year',
              position: 'insideBottomRight',
              offset: -5,
              fontSize: 11,
              fill: textColor,
            }}
          />
          <YAxis
            width={sharedTimeAxis ? SHARED_Y_AXIS_WIDTH : undefined}
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            tickFormatter={(value) => `${value / 1000}k`}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
            tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
            label={{ value: 'Troops furnished', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: textColor }}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                {...props}
                label={sharedTimeAxis && props.label != null
                  ? formatYearTick(props.label)
                  : props.label}
                darkMode={darkMode}
              />
            )}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
            formatter={(value, entry) => legendLabel(value, entry, darkMode)}
          />
          <ReferenceLine
            x={sharedTimeAxis ? yearToAxis(1778) : 1778}
            stroke={ink.body}
            strokeDasharray="3 3"
            label={{
              value: 'Valley Forge',
              position: 'top',
              fontSize: 11,
              fill: ink.body,
              fontWeight: 600
            }}
          />
          <Area
            type="monotone"
            dataKey="continentalPay"
            name="In Continental pay"
            stroke={continental.hue}
            fill="url(#colorContinental)"
            strokeWidth={3}
            stackId="troops"
            dot={{ fill: continental.hue, r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
          <Area
            type="monotone"
            dataKey="militia"
            name="Militia & short-term troops"
            stroke={militia.hue}
            // Dashed as well as gold. Under deuteranopia the two series sit
            // close enough that colour alone is a weak signal.
            strokeDasharray={militia.dash}
            fill="url(#colorMilitia)"
            strokeWidth={3}
            stackId="troops"
            dot={{ fill: militia.hue, r: 4 }}
            activeDot={{ r: 6, cursor: 'pointer' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </CompactFrame>
      <ChartTable
        caption="American troops furnished by year"
        columns={['Year', 'In Continental pay', 'Militia & short-term troops']}
        rows={data.map((d) => [
          d.year,
          d.continentalPay.toLocaleString(),
          d.militia.toLocaleString(),
        ])}
      />
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
  const ink = chartInk(darkMode);
  const textColor = ink.muted;
  const exports_ = chartSeries('american', darkMode);
  const imports_ = chartSeries('british', darkMode);
  const peakImports = data.find(entry => entry.year === 1771)?.colonialImports ?? 0;
  const finalImports = data.find(entry => entry.year === 1776)?.colonialImports ?? 0;
  const importDrop = peakImports
    ? ((1 - finalImports / peakImports) * 100).toFixed(1)
    : '0.0';
  const reduceMotion = useReducedMotion();

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      {...entrance(reduceMotion, compact ? 0 : 0.15)}
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
      <CompactFrame compact={compact} fallback={200}>
      <ResponsiveContainer
        width="100%"
        height={compact ? '100%' : 280}
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
          <Legend
            wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
            formatter={(value, entry) => legendLabel(value, entry, darkMode)}
          />
          <ReferenceLine
            x={1775}
            stroke={ink.body}
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
            stroke={exports_.hue}
            strokeWidth={3}
            dot={{ fill: exports_.hue, r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            type="monotone"
            dataKey="colonialImports"
            name="Imports from England"
            stroke={imports_.hue}
            // The two trade lines cross repeatedly, and navy against red is
            // the pairing protanopia flattens hardest. The dash tells them
            // apart where the colour cannot.
            strokeDasharray={imports_.dash}
            strokeWidth={3}
            dot={{ fill: imports_.hue, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      </CompactFrame>
      <ChartTable
        caption="Colonial trade with England by year, in millions of pounds"
        columns={['Year', 'Exports to England (£m)', 'Imports from England (£m)']}
        // Two decimals: the raw series carries six, which a screen reader
        // reads out digit by digit as "one point zero one five five three
        // five" for a chart whose axis is labelled in millions.
        rows={data.map((d) => [
          d.year,
          d.colonialExports.toFixed(2),
          d.colonialImports.toFixed(2),
        ])}
      />
      {!compact && (
        <ChartSource
          source={source}
          note="The Census recommends these official values as a relative trade index, not current market values."
        />
      )}
    </Motion.div>
  );
}

function wrapTitle(title, maxChars) {
  if (!title || title.length <= maxChars) return [title];
  const idx = title.lastIndexOf(' ', maxChars);
  if (idx < 6) return [title];
  const rest = title.slice(idx + 1);
  return [title.slice(0, idx), ...wrapTitle(rest, maxChars)];
}

function CampaignNameTick({ x, y, payload, darkMode, compact }) {
  const ink = chartInk(darkMode);
  const lines = wrapTitle(payload.value, compact ? 11 : 14);
  const fontSize = compact ? 10 : 11;
  const lineH = compact ? 11 : 13;
  const startY = -((lines.length - 1) * lineH) / 2 + 4;

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={`${line}-${i}`}
          x={-6}
          y={startY + i * lineH}
          textAnchor="end"
          fill={ink.body}
          fontSize={fontSize}
          fontFamily="var(--font-body)"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

// Label column plus a fixed mark gutter to the left of every battle name.
// The mark must not sit on the plot origin — that docks it to the bar start
// and collides with short values.
const CASUALTY_LABEL_WIDTH = { compact: 88, full: 120 };
const CASUALTY_MARK_GUTTER = { compact: 14, full: 16 };

function casualtyAxisWidth(compact) {
  const key = compact ? 'compact' : 'full';
  return CASUALTY_LABEL_WIDTH[key] + CASUALTY_MARK_GUTTER[key];
}

// Full-width category wash for hover and selected. Geometry comes from the
// categorical Y domain, not from bar length — so Bunker Hill and Long Island
// get the same band.
function CategoryRowBands({ data, selectedBattleId, hoveredIndex, hoverFill, selectedFill }) {
  const plot = usePlotArea();
  const domain = useYAxisDomain();
  if (!plot || !domain?.length) return null;

  const bandH = plot.height / domain.length;
  // Plot only — a rounded rect over the names reads as a chip around the
  // label, which is the extra square on rows like Brandywine.
  const selectedIndex = data.findIndex((d) => d.id != null && d.id === selectedBattleId);

  const rows = [];
  if (selectedIndex >= 0) {
    rows.push({ index: selectedIndex, fill: selectedFill, key: 'selected' });
  }
  if (hoveredIndex != null && hoveredIndex !== selectedIndex) {
    rows.push({ index: hoveredIndex, fill: hoverFill, key: 'hover' });
  }

  return (
    <ZIndexLayer zIndex={DefaultZIndexes.cursorRectangle}>
      <g className="casualty-row-bands" pointerEvents="none">
        {rows.map(({ index, fill, key }) => (
          <rect
            key={key}
            className={`casualty-row-band casualty-row-band--${key}`}
            x={plot.x}
            y={plot.y + index * bandH}
            width={plot.width}
            height={bandH}
            fill={fill}
          />
        ))}
      </g>
    </ZIndexLayer>
  );
}

function CasualtyAxisTick({
  x,
  y,
  payload,
  year,
  darkMode,
  compact,
  marked,
  markColor,
}) {
  const ink = chartInk(darkMode);
  const lines = wrapTitle(payload.value, compact ? 11 : 14);
  const fontSize = compact ? 10 : 12;
  const lineH = compact ? 11 : 13;
  const extra = compact || year == null ? 0 : 12;
  const blockH = lines.length * lineH + extra;
  const startY = -blockH / 2 + lineH * 0.75;
  const key = compact ? 'compact' : 'full';
  // Fixed column: left edge of the label block, same x on every row.
  const markX = -casualtyAxisWidth(compact) + CASUALTY_MARK_GUTTER[key] / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {marked && (
        <circle
          className="casualty-row-mark"
          cx={markX}
          cy={0}
          r={compact ? 3 : 3.5}
          fill={markColor}
        />
      )}
      {lines.map((line, i) => (
        <text
          key={`${line}-${i}`}
          x={-6}
          y={startY + i * lineH}
          textAnchor="end"
          fill={ink.body}
          fontSize={fontSize}
          fontFamily="var(--font-body)"
        >
          {line}
        </text>
      ))}
      {!compact && year != null && (
        <text
          x={-6}
          y={startY + lines.length * lineH + 1}
          textAnchor="end"
          fill={ink.muted}
          fontSize={10}
          fontFamily="var(--font-body)"
        >
          {year}
        </text>
      )}
    </g>
  );
}

export function CasualtiesChart({
  data,
  darkMode,
  onBattleClick,
  onBattleSelect,
  selectedBattleId,
  compact = false,
}) {
  const ink = chartInk(darkMode);
  const textColor = ink.muted;
  const american = chartSeries('american', darkMode);
  const crown = chartSeries('british', darkMode);
  const hoverFill = darkMode ? 'rgba(232, 123, 150, 0.08)' : 'rgba(122, 18, 18, 0.05)';
  const selectedFill = darkMode ? 'rgba(232, 123, 150, 0.12)' : 'rgba(122, 18, 18, 0.08)';
  const reduceMotion = useReducedMotion();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  // Horizontal bars: one row per engagement so names stay readable and the
  // chart grows with the list instead of forcing a sideways scroll.
  const rowPx = compact ? 26 : 46;
  const chartHeight = Math.max(compact ? 160 : 280, data.length * rowPx + (compact ? 48 : 88));

  const selectDatum = (state) => {
    const index = Number(state?.activeIndex);
    return Number.isInteger(index) ? data[index] : undefined;
  };

  const plot = (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: compact ? 320 : 720, height: compact ? 240 : chartHeight }}
    >
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: compact ? 4 : 28, right: 16, left: 4, bottom: compact ? 4 : 4 }}
        barCategoryGap="22%"
        barGap={2}
        // Recharts 3 dropped `activePayload` from the chart-level click
        // state — it now reports `activeIndex` and `activeLabel` only.
        onClick={(state) => {
          const datum = selectDatum(state);
          if (datum?.id == null) return;
          // Data tab: a click inspects the comparison below. Interludes still
          // jump into the story because there is no comparison panel there.
          if (compact) onBattleClick?.(datum.id);
          else onBattleSelect?.(datum.id);
        }}
        onMouseMove={(state) => {
          const index = Number(state?.activeIndex);
          setHoveredIndex(Number.isInteger(index) ? index : null);
        }}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ cursor: 'pointer' }}
      >
        <XAxis
          type="number"
          scale="sqrt"
          domain={[0, 'dataMax']}
          allowDecimals={false}
          stroke={textColor}
          tick={{ fontSize: 11, fill: textColor }}
          tickFormatter={(n) => Number(n).toLocaleString()}
          axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
        />
        <YAxis
          type="category"
          dataKey="title"
          width={casualtyAxisWidth(compact)}
          interval={0}
          stroke={textColor}
          tick={(props) => {
            const id = data[props.index]?.id;
            const marked = props.index === hoveredIndex || (id != null && id === selectedBattleId);
            return (
              <CasualtyAxisTick
                {...props}
                year={data[props.index]?.year}
                darkMode={darkMode}
                compact={compact}
                marked={marked}
                markColor={crown.hue}
              />
            );
          }}
          axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          tickLine={{ stroke: textColor, strokeOpacity: 0.3 }}
        />
        <Customized
          component={CategoryRowBands}
          data={data}
          selectedBattleId={selectedBattleId}
          hoveredIndex={hoveredIndex}
          hoverFill={hoverFill}
          selectedFill={selectedFill}
        />
        <Tooltip
          content={<CustomTooltip darkMode={darkMode} />}
          cursor={false}
        />
        {!compact && (
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '4px', fontSize: '13px' }}
            formatter={(value, entry) => legendLabel(value, entry, darkMode)}
          />
        )}
        <Bar
          dataKey="americanCasualties"
          name="American / allied"
          fill={american.hue}
          radius={[0, 4, 4, 0]}
          barSize={compact ? 7 : 11}
          activeBar={false}
        />
        <Bar
          dataKey="britishCasualties"
          name="Crown / allied"
          fill={crown.hue}
          radius={[0, 4, 4, 0]}
          barSize={compact ? 7 : 11}
          activeBar={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Motion.div
      className={`chart-container casualties-chart ${compact ? 'compact' : ''}`}
      {...entrance(reduceMotion, compact ? 0 : 0.25)}
      role="region"
      aria-label="Casualties by Major Battle Chart"
    >
      {!compact && (
        <>
          <h3 className="chart-title">Casualties by Major Battle</h3>
          <p className="chart-takeaway">
            These selected engagements mix killed, wounded, missing, and captured; they must not
            be added to estimate total war deaths. The list runs chronologically, earliest at the
            top. The axis uses a square-root scale so earlier, smaller fights remain readable
            beside later surrenders. Click a row to compare it below.
          </p>
        </>
      )}
      {compact ? (
        <div
          className="chart-scroll-frame chart-scroll-frame--y"
          tabIndex={0}
          aria-label="Scrollable chronological battle casualty chart"
        >
          <div style={{ height: chartHeight }}>{plot}</div>
        </div>
      ) : (
        <div style={{ height: chartHeight }}>{plot}</div>
      )}
      <ChartTable
        caption="Estimated casualties by major battle"
        columns={['Battle', 'Year', 'American / allied', 'Crown / allied']}
        rows={data.map((d) => [
          d.title,
          d.year,
          d.americanCasualties.toLocaleString(),
          d.britishCasualties.toLocaleString(),
        ])}
      />
    </Motion.div>
  );
}

export function CampaignTimeline({ data, darkMode, compact = false, sharedTimeAxis = false }) {
  const ink = chartInk(darkMode);
  const textColor = ink.muted;
  const dayMs = 86400000;

  const regionColors = {
    north: chartSeries('american', darkMode).hue,
    mid: chartSeries('militia', darkMode).hue,
    south: chartSeries('british', darkMode).hue,
  };

  const chartData = data.map(c => {
    const startYear = utcYearFraction(c.start);
    const endYear = utcYearFraction(c.end);
    const durationDays = Math.round((new Date(c.end).getTime() - new Date(c.start).getTime()) / dayMs);
    return {
      name: c.name,
      start: yearToAxis(startYear),
      duration: endYear - startYear,
      durationDays,
      region: c.region,
      startDate: c.start,
      endDate: c.end
    };
  });

  const reduceMotion = useReducedMotion();
  const timeMargin = sharedTimeAxis
    ? SHARED_TIME_MARGIN
    : { top: 10, right: 30, left: 10, bottom: 10 };

  return (
    <Motion.div
      className={`chart-container ${compact ? 'compact' : ''}`}
      {...entrance(reduceMotion, compact ? 0 : 0.35)}
      role="region"
      aria-label="Military Campaigns Timeline"
    >
      {!compact && (
        <>
          <h3 className="chart-title">Theater of Operations</h3>
          <p className="chart-takeaway">
            The conflict overlapped across Canada, New England, the Mid-Atlantic, the Gulf,
            and the South before American-French forces converged on Yorktown.
            {sharedTimeAxis ? ' Bars line up with the troop years above.' : ''}
          </p>
        </>
      )}
      <div className="campaign-legend" style={{ marginBottom: sharedTimeAxis ? '0.5rem' : '1rem' }}>
        {Object.entries(regionColors).map(([region, color]) => (
          <span key={region} className="campaign-legend-item" style={{ fontSize: '12px' }}>
            <span className="campaign-legend-dot" style={{ background: color, width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
            {REGION_NAMES[region] ?? region}
          </span>
        ))}
      </div>
      <CompactFrame compact={compact} fallback={240}>
      <ResponsiveContainer
        width="100%"
        height={compact ? '100%' : Math.max(300, data.length * (sharedTimeAxis ? 42 : 36))}
        minWidth={0}
        initialDimension={{ width: 320, height: compact ? 240 : Math.max(300, data.length * (sharedTimeAxis ? 42 : 36)) }}
      >
        <BarChart data={chartData} layout="vertical" margin={timeMargin}>
          <XAxis
            type="number"
            tickFormatter={formatYearTick}
            stroke={textColor}
            tick={{ fontSize: 12, fill: textColor }}
            domain={SHARED_AXIS_DOMAIN}
            ticks={SHARED_AXIS_TICKS}
            allowDecimals={false}
            interval={0}
            minTickGap={0}
            padding={{ left: 0, right: 0 }}
            axisLine={{ stroke: textColor, strokeOpacity: 0.4 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={textColor}
            width={sharedTimeAxis ? SHARED_Y_AXIS_WIDTH : 140}
            interval={0}
            tick={sharedTimeAxis
              ? (props) => <CampaignNameTick {...props} darkMode={darkMode} compact={compact} />
              : { fontSize: 11, fill: textColor }}
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
                    <p style={{ margin: '2px 0', color: textColor }}>{d.durationDays} days</p>
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
      </CompactFrame>
      <ChartTable
        caption="Campaigns by theatre and date range"
        columns={['Campaign', 'Theatre', 'Began', 'Ended']}
        rows={chartData.map((d) => [d.name, REGION_NAMES[d.region] ?? d.region, d.startDate, d.endDate])}
      />
      {!compact && (
        <ChartSource note="Campaign boundaries are interpretive ranges for the selected operations, not a count of continuous fighting." />
      )}
    </Motion.div>
  );
}
