import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { MapContainer, Marker, Polyline, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getSymbolSvg = (type, color) => {
  switch (type) {
    case 'battle':
      return `<svg viewBox="0 0 16 16" width="100%" height="100%"><line x1="4" y1="4" x2="12" y2="12" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><line x1="12" y1="4" x2="4" y2="12" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
    case 'political':
      return `<svg viewBox="0 0 16 16" width="100%" height="100%"><rect x="3.5" y="2" width="9" height="12" rx="1" stroke="${color}" stroke-width="1.6" fill="none"/><line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke="${color}" stroke-width="1.2"/><line x1="5.5" y1="8" x2="10.5" y2="8" stroke="${color}" stroke-width="1.2"/><line x1="5.5" y1="10.5" x2="8.5" y2="10.5" stroke="${color}" stroke-width="1.2"/></svg>`;
    case 'diplomatic':
      return `<svg viewBox="0 0 16 16" width="100%" height="100%"><circle cx="8" cy="8" r="5" stroke="${color}" stroke-width="1.6" fill="none"/><circle cx="8" cy="8" r="2" fill="${color}"/></svg>`;
    case 'military':
      return `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M8 2L13 5V10C13 12.5 10.5 14.5 8 15C5.5 14.5 3 12.5 3 10V5L8 2Z" stroke="${color}" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>`;
    default:
      return `<svg viewBox="0 0 16 16" width="100%" height="100%"><circle cx="8" cy="8" r="4" fill="${color}"/></svg>`;
  }
};

const createEventIcon = (event, isActive, isFuture = false, proximity = 1.0) => {
  const colors = {
    american: '#1e3a5f',
    british: '#8b2323'
  };

  // Depth-of-field: markers far from active shrink and fade
  const depthScale = isActive ? 1 : (0.65 + 0.35 * proximity);
  const baseSize = isActive ? 44 : 34;
  const size = Math.round(baseSize * depthScale);
  const depthOpacity = isFuture ? 0.25 : (isActive ? 1 : (0.4 + 0.6 * proximity));
  const borderColor = colors[event.side] || '#1e3a5f';
  const bgColor = isActive ? borderColor : '#fffef5';
  const textColor = isActive ? '#fffef5' : borderColor;
  const shadowOpacity = isFuture ? 0.1 : (isActive ? 0.5 : 0.15 * proximity);
  const shadowBlur = isActive ? 16 : Math.round(6 * proximity);
  const symbolSize = Math.round(size * 0.5);

  const pulseSize = size + 16;
  const pulseRing = isActive ? `
    <div class="marker-pulse-ring" style="
      position: absolute;
      top: ${-(pulseSize - size) / 2}px;
      left: ${-(pulseSize - size) / 2}px;
      width: ${pulseSize}px;
      height: ${pulseSize}px;
      border-radius: 50%;
      border: 2px solid ${borderColor};
      animation: markerPulse 2s ease-out infinite;
    "></div>
  ` : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div role="button" tabindex="0" aria-label="${event.title}" style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${pulseRing}
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${bgColor};
          border: ${isActive ? 3 : Math.max(2, Math.round(3 * depthScale))}px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 ${isActive ? 4 : 2}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity});
          transition: all 0.3s ease;
          cursor: pointer;
          opacity: ${depthOpacity};
        ">
          <div style="width: ${symbolSize}px; height: ${symbolSize}px;">${getSymbolSvg(event.type, textColor)}</div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Memoized Event Marker to prevent flickering
const EventMarker = memo(({ event, isActive, isFuture, proximity, onClick }) => {
  const icon = useMemo(() => {
    return createEventIcon(event, isActive, isFuture, proximity);
  }, [event.id, event.type, event.side, event.title, event.date, isActive, isFuture, Math.round(proximity * 100)]);

  return (
    <Marker
      position={[event.lat, event.lng]}
      icon={icon}
      zIndexOffset={isActive ? 1000 : 0}
      eventHandlers={{
        click: onClick
      }}
    />
  );
}, (prev, next) => {
  return (
    prev.event.id === next.event.id &&
    prev.isActive === next.isActive &&
    prev.isFuture === next.isFuture &&
    Math.round(prev.proximity * 100) === Math.round(next.proximity * 100) // Stabilize proximity changes
  );
});

const createColonyLabel = (abbrev, darkMode) => {
  const textColor = darkMode ? 'rgba(220, 200, 180, 0.9)' : 'rgba(60, 40, 20, 0.85)';
  const shadowColor = darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';

  return L.divIcon({
    className: 'colony-label',
    html: `
      <div style="
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 12px;
        font-weight: 600;
        font-style: italic;
        color: ${textColor};
        text-shadow: 
          1px 1px 2px ${shadowColor},
          -1px -1px 2px ${shadowColor},
          1px -1px 2px ${shadowColor},
          -1px 1px 2px ${shadowColor};
        white-space: nowrap;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        pointer-events: none;
      ">
        ${abbrev}
      </div>
    `,
    iconSize: [40, 20],
    iconAnchor: [20, 10]
  });
};

function MapController({ center, zoom, autoFly }) {
  const map = useMap();
  const prevCenterRef = useRef(null);
  const prevZoomRef = useRef(null);

  useEffect(() => {
    if (autoFly && center) {
      const prevCenter = prevCenterRef.current;
      const prevZoom = prevZoomRef.current;
      
      // Use a small epsilon to avoid jitter from floating point precision
      const EPSILON = 0.0001;
      const centerChanged = !prevCenter ||
        Math.abs(prevCenter[0] - center[0]) > EPSILON ||
        Math.abs(prevCenter[1] - center[1]) > EPSILON;
      
      const zoomChanged = prevZoom !== zoom;

      if (centerChanged || zoomChanged) {
        // If moving a significant distance, use flyTo for smoothness
        const dist = prevCenter ? Math.sqrt(Math.pow(prevCenter[0] - center[0], 2) + Math.pow(prevCenter[1] - center[1], 2)) : 0;
        
        if (dist > 2) {
          map.flyTo(center, zoom, {
            duration: 0.8,
            easeLinearity: 0.25
          });
        } else {
          map.setView(center, zoom, {
            animate: true,
            duration: 0.4
          });
        }
        
        prevCenterRef.current = center;
        prevZoomRef.current = zoom;
      }
    }
  }, [center, zoom, map, autoFly]);

  return null;
}

const colonyColors = {
  'Massachusetts': '#A08070',
  'Maine': '#A08070',
  'District of Maine': '#A08070',
  'New Hampshire': '#7A9088',
  'Connecticut': '#8090A8',
  'Rhode Island': '#9088A0',
  'New York': '#B0A080',
  'New Jersey': '#A09870',
  'Pennsylvania': '#809880',
  'Delaware': '#80A098',
  'Maryland': '#A09080',
  'Virginia': '#A08080',
  'North Carolina': '#90987A',
  'South Carolina': '#809098',
  'Georgia': '#A09078'
};

const ColonyBoundaries = memo(({ boundaries, darkMode, fillColonies }) => {
  const [hoveredColony, setHoveredColony] = useState(null);

  const style = useCallback((feature) => {
    const colonyName = feature.properties.name;
    const isHovered = hoveredColony === colonyName;

    // Period chart palette: sepia ink on parchment / gold ink on midnight
    const strokeColorLight = '#5B4636';
    const strokeColorDark = '#C5A02F';

    if (fillColonies) {
      return {
        fillColor: colonyColors[colonyName] || (darkMode ? '#E0C060' : '#B99C6B'),
        weight: isHovered ? 2 : 1.2,
        opacity: darkMode ? 0.55 : 0.75,
        color: darkMode ? strokeColorDark : strokeColorLight,
        fillOpacity: isHovered ? 0.4 : 0.28,
        dashArray: null
      };
    }

    // Outline mode (default): hand-inked border look with a faint land wash
    return {
      fillColor: darkMode ? '#C5A02F' : '#C8B085',
      weight: isHovered ? 2.2 : 1.4,
      opacity: isHovered ? 0.95 : 0.7,
      color: darkMode ? strokeColorDark : strokeColorLight,
      fillOpacity: isHovered ? 0.22 : 0.1,
      dashArray: null,
      className: 'colony-boundary'
    };
  }, [darkMode, fillColonies, hoveredColony]);

  const onEachFeature = useCallback((feature, layer) => {
    const props = feature.properties;

    const partOfText = props.partOf ? `<div style="font-style: italic; color: #888;">(Part of ${props.partOf})</div>` : '';

    layer.bindTooltip(
      `<div class="colony-tooltip">
        <strong>${props.name}</strong>
        ${partOfText}
        <div class="tooltip-stats">
          <span>Pop: ${props.population.toLocaleString()}</span>
          <span>Export: ${props.mainExport}</span>
          <span>Value: £${props.exports.toLocaleString()}</span>
        </div>
      </div>`,
      {
        permanent: false,
        direction: 'top',
        className: 'colony-tooltip-container'
      }
    );

    layer.on({
      mouseover: (e) => {
        setHoveredColony(props.name);
        e.target.setStyle({
          fillOpacity: 0.25,
          weight: 3,
          dashArray: null
        });
      },
      mouseout: (e) => {
        setHoveredColony(null);
        e.target.setStyle({
          fillOpacity: fillColonies ? 0.35 : 0.1,
          weight: 2,
          dashArray: fillColonies ? null : '4, 4'
        });
      }
    });
  }, [fillColonies]);

  return (
    <GeoJSON
      data={boundaries}
      style={style}
      onEachFeature={onEachFeature}
      smoothFactor={1.5}
    />
  );
});

function ColonyLabels({ boundaries, darkMode, events = [] }) {
  const getAdjustedPosition = (labelLat, labelLng) => {
    const PROXIMITY_THRESHOLD = 1.2;
    const OFFSET_AMOUNT = 0.8;

    let offsetLat = 0;
    let offsetLng = 0;

    for (const event of events) {
      const latDiff = Math.abs(event.lat - labelLat);
      const lngDiff = Math.abs(event.lng - labelLng);

      if (latDiff < PROXIMITY_THRESHOLD && lngDiff < PROXIMITY_THRESHOLD) {
        if (event.lat > labelLat) {
          offsetLat -= OFFSET_AMOUNT;
        } else {
          offsetLat += OFFSET_AMOUNT;
        }
        if (event.lng > labelLng) {
          offsetLng -= OFFSET_AMOUNT * 0.5;
        } else {
          offsetLng += OFFSET_AMOUNT * 0.5;
        }
        break;
      }
    }

    return [labelLat + offsetLat, labelLng + offsetLng];
  };

  return (
    <>
      {boundaries.features.map((feature) => {
        const props = feature.properties;
        if (!props.labelLat || !props.labelLng) return null;

        const position = getAdjustedPosition(props.labelLat, props.labelLng);

        return (
          <Marker
            key={`label-${props.name}`}
            position={position}
            icon={createColonyLabel(props.abbrev, darkMode)}
            interactive={false}
          />
        );
      })}
    </>
  );
}

const TroopMovementLines = memo(({ events, activeEventId, darkMode }) => {
  const activeIndex = useMemo(() => events.findIndex(e => e.id === activeEventId), [events, activeEventId]);
  const visibleEvents = useMemo(() => events.slice(0, activeIndex + 1), [events, activeIndex]);
  const color = darkMode ? '#C5A02F' : '#0A244A';
  const headColor = darkMode ? '#E0C060' : '#1e3a5f';

  // Build segments with age-based opacity
  const rendered = useMemo(() => {
    const segments = [];
    const yearMarkers = [];
    let lastYear = null;

    for (let i = 1; i < visibleEvents.length; i++) {
      const age = (visibleEvents.length - 1 - i) / Math.max(visibleEvents.length - 1, 1);
      const opacity = 0.06 + (1 - age) * 0.54; // fades from 0.6 (newest) to 0.06 (oldest)
      const weight = i === visibleEvents.length - 1 ? 3.5 : Math.max(1, 2 * (1 - age * 0.6));
      const segColor = i === visibleEvents.length - 1 ? headColor : color;

      segments.push(
        <Polyline
          key={`seg-${visibleEvents[i].id}`}
          positions={[[visibleEvents[i - 1].lat, visibleEvents[i - 1].lng], [visibleEvents[i].lat, visibleEvents[i].lng]]}
          pathOptions={{
            color: segColor,
            weight,
            opacity,
            dashArray: i === visibleEvents.length - 1 ? null : '6, 6',
            lineCap: 'round',
          }}
        />
      );

      // Year markers at year transitions
      const eventYear = new Date(visibleEvents[i].date).getUTCFullYear();
      if (lastYear !== null && eventYear !== lastYear) {
        yearMarkers.push(
          <Marker
            key={`year-${eventYear}-${i}`}
            position={[visibleEvents[i].lat, visibleEvents[i].lng]}
            icon={L.divIcon({
              className: 'trail-year-marker',
              html: `<span class="${darkMode ? 'dark' : ''}">${eventYear}</span>`,
              iconSize: [36, 16],
              iconAnchor: [18, -6],
            })}
            interactive={false}
          />
        );
      }
      lastYear = eventYear;
    }
    return <>{segments}{yearMarkers}</>;
  }, [visibleEvents, color, headColor, darkMode]);

  if (activeIndex < 1) return null;
  return rendered;
});

function MapLegend({ darkMode, timelineOpen }) {
  const items = [
    { type: 'battle', label: 'Battle', border: '#7A1212' },
    { type: 'political', label: 'Political', border: '#0A244A' },
    { type: 'diplomatic', label: 'Diplomatic', border: '#C5A02F' },
    { type: 'military', label: 'Military', border: '#228B22' },
  ];

  const sides = [
    { color: '#1e3a5f', label: 'American' },
    { color: '#8b2323', label: 'British' },
  ];

  const getLegendSymbol = (type, color) => {
    switch (type) {
      case 'battle':
        return (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <line x1="4" y1="4" x2="12" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="12" y1="4" x2="4" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        );
      case 'political':
        return (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <rect x="3.5" y="2" width="9" height="12" rx="1" stroke={color} strokeWidth="1.6" fill="none"/>
            <line x1="5.5" y1="5.5" x2="10.5" y2="5.5" stroke={color} strokeWidth="1.2"/>
            <line x1="5.5" y1="8" x2="10.5" y2="8" stroke={color} strokeWidth="1.2"/>
            <line x1="5.5" y1="10.5" x2="8.5" y2="10.5" stroke={color} strokeWidth="1.2"/>
          </svg>
        );
      case 'diplomatic':
        return (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1.6" fill="none"/>
            <circle cx="8" cy="8" r="2" fill={color}/>
          </svg>
        );
      case 'military':
        return (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 2L13 5V10C13 12.5 10.5 14.5 8 15C5.5 14.5 3 12.5 3 10V5L8 2Z" stroke={color} strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 16 16" width="14" height="14">
            <circle cx="8" cy="8" r="4" fill={color}/>
          </svg>
        );
    }
  };

  return (
    <div className={`map-legend ${darkMode ? 'dark' : ''} ${timelineOpen ? 'timeline-open' : ''}`}>
      <h4>Legend</h4>
      {items.map((item, i) => (
        <div key={i} className="legend-item">
          <span className="legend-symbol" style={{ borderColor: item.border }}>
            {getLegendSymbol(item.type, item.border)}
          </span>
          <span className="legend-label">{item.label}</span>
        </div>
      ))}
      <div className="legend-divider" />
      {sides.map((s, i) => (
        <div key={i} className="legend-item">
          <span className="legend-dot" style={{ background: s.color }} />
          <span className="legend-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

const easternSeaboardBounds = [
  [28.0, -85.0],
  [48.0, -60.0]
];

export default function Map({
  events,
  colonyBoundaries,
  activeEventId,
  onEventClick,
  showColonies,
  fillColonies = false,
  darkMode,
  autoFly = true,
  hideFutureEvents = false,
  scrollWheelZoom = false,
  timelineOpen = false
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const activeEvent = events.find(e => e.id === activeEventId);
  const activeEventDate = activeEvent ? new Date(activeEvent.date) : null;
  const lngOffset = isMobile ? 0 : -3.5; // Push map center to the left so marker appears on the right
  const latOffset = isMobile ? 0 : 0;
  const center = activeEvent
    ? [activeEvent.lat + latOffset, activeEvent.lng + lngOffset]
    : [40.0, -74.0];
  const zoom = activeEvent ? 6 : 5;

  const visibleEvents = events.filter(event => {
    if (!hideFutureEvents) return true;
    if (!activeEventDate) return true;
    return new Date(event.date) <= activeEventDate;
  });

  const isFutureEvent = (event) => {
    if (!activeEventDate) return false;
    return new Date(event.date) > activeEventDate;
  };

  const handleEventClick = useCallback((id) => {
    onEventClick(id);
  }, [onEventClick]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const focused = document.activeElement;
        if (focused && focused.getAttribute('role') === 'button' && focused.closest('.custom-marker')) {
          e.preventDefault();
          focused.click();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className={`map-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="map-parchment-grain" aria-hidden="true" />
      <svg className="map-compass-rose" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        {/* cardinal points */}
        <path d="M50 8 L54 46 L50 50 L46 46 Z" fill="currentColor" opacity="0.85" />
        <path d="M50 92 L54 54 L50 50 L46 54 Z" fill="currentColor" opacity="0.5" />
        <path d="M8 50 L46 46 L50 50 L46 54 Z" fill="currentColor" opacity="0.5" />
        <path d="M92 50 L54 46 L50 50 L54 54 Z" fill="currentColor" opacity="0.5" />
        {/* intercardinal points */}
        <path d="M26 26 L47 43 L43 47 Z" fill="currentColor" opacity="0.35" />
        <path d="M74 26 L57 43 L53 47 Z" fill="currentColor" opacity="0.35" />
        <path d="M26 74 L43 57 L47 53 Z" fill="currentColor" opacity="0.35" />
        <path d="M74 74 L57 57 L53 53 Z" fill="currentColor" opacity="0.35" />
        <text x="50" y="6" textAnchor="middle" fontSize="9" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fill="currentColor">N</text>
      </svg>
      <MapContainer
        center={[40.0, -74.0]}
        zoom={5}
        minZoom={4}
        maxBounds={easternSeaboardBounds}
        maxBoundsViscosity={0.8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        {/* No tile layer: the map renders as a period parchment chart —
            textured paper background (CSS) with inked colony boundaries */}
        <MapController center={center} zoom={zoom} autoFly={autoFly} />

        {showColonies && colonyBoundaries && (
          <>
            <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} fillColonies={fillColonies} />
            <ColonyLabels boundaries={colonyBoundaries} darkMode={darkMode} events={visibleEvents} />
          </>
        )}

        <TroopMovementLines events={events} activeEventId={activeEventId} darkMode={darkMode} />

        {visibleEvents.map((event) => {
          // Compute proximity to active event (0 = far, 1 = close)
          let proximity = 1.0;
          if (activeEvent && event.id !== activeEventId) {
            const dLat = event.lat - activeEvent.lat;
            const dLng = event.lng - activeEvent.lng;
            const dist = Math.sqrt(dLat * dLat + dLng * dLng);
            proximity = Math.max(0, Math.min(1, 1 - dist / 12));
          }
          return (
            <EventMarker
              key={event.id}
              event={event}
              isActive={event.id === activeEventId}
              isFuture={isFutureEvent(event)}
              proximity={proximity}
              onClick={() => handleEventClick(event.id)}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
