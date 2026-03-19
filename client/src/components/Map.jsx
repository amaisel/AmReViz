import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createEventIcon = (type, side, isActive, isFuture = false, proximity = 1.0) => {
  const colors = {
    american: '#1e3a5f',
    british: '#8b2323'
  };

  const symbols = {
    battle: '⚔',
    political: '📜',
    diplomatic: '🤝'
  };

  // Depth-of-field: markers far from active shrink and fade
  const depthScale = isActive ? 1 : (0.65 + 0.35 * proximity);
  const baseSize = isActive ? 44 : 34;
  const size = Math.round(baseSize * depthScale);
  const depthOpacity = isFuture ? 0.25 : (isActive ? 1 : (0.4 + 0.6 * proximity));
  const borderColor = colors[side] || '#1e3a5f';
  const bgColor = isActive ? borderColor : '#fffef5';
  const textColor = isActive ? '#fffef5' : borderColor;
  const shadowOpacity = isFuture ? 0.1 : (isActive ? 0.5 : 0.15 * proximity);
  const shadowBlur = isActive ? 16 : Math.round(6 * proximity);

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
      <div style="
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
          font-size: ${size * 0.45}px;
          box-shadow: 0 ${isActive ? 4 : 2}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity});
          transition: all 0.3s ease;
          cursor: pointer;
          opacity: ${depthOpacity};
          filter: ${isActive ? 'none' : `blur(${Math.round((1 - proximity) * 0.5)}px)`};
        ">
          <span style="color: ${textColor};">${symbols[type] || '●'}</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

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

  useEffect(() => {
    if (autoFly && center) {
      const prevCenter = prevCenterRef.current;
      const centerChanged = !prevCenter ||
        prevCenter[0] !== center[0] ||
        prevCenter[1] !== center[1];

      if (centerChanged) {
        map.setView(center, zoom, {
          animate: true,
          duration: 0.3
        });
        prevCenterRef.current = center;
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

function ColonyBoundaries({ boundaries, darkMode, fillColonies }) {
  const [hoveredColony, setHoveredColony] = useState(null);

  const style = (feature) => {
    const colonyName = feature.properties.name;
    const isHovered = hoveredColony === colonyName;

    // Sleek & Deep Palette Integration
    const strokeColorLight = '#0A244A'; // Deep Navy
    const strokeColorDark = '#C5A02F';  // Muted Gold

    const fillColorLight = '#1e3a5f';
    const fillColorDark = '#E0C060';

    if (fillColonies) {
      return {
        fillColor: colonyColors[colonyName] || (darkMode ? fillColorDark : fillColorLight),
        weight: isHovered ? 2 : 1,
        opacity: 1,
        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)',
        fillOpacity: isHovered ? 0.35 : 0.22,
        dashArray: null
      };
    }

    // Outline Mode (Default)
    return {
      fillColor: darkMode ? '#C5A02F' : '#0A244A',
      weight: isHovered ? 2.5 : 1.5,
      opacity: isHovered ? 1 : 0.6,
      color: darkMode ? strokeColorDark : strokeColorLight,
      fillOpacity: isHovered ? 0.15 : 0.02, // Subtle tint for depth
      dashArray: null, // Solid lines for sleeker look
      className: 'colony-boundary' // For potential CSS transitions
    };
  };

  const onEachFeature = (feature, layer) => {
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
  };

  return (
    <GeoJSON
      data={boundaries}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

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

function TroopMovementLines({ events, activeEventId, darkMode }) {
  const activeIndex = events.findIndex(e => e.id === activeEventId);
  if (activeIndex < 1) return null;

  const visibleEvents = events.slice(0, activeIndex + 1);
  const color = darkMode ? '#C5A02F' : '#0A244A';
  const headColor = darkMode ? '#E0C060' : '#1e3a5f';

  // Build segments with age-based opacity
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
        key={`seg-${i}`}
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
}

function MapLegend({ darkMode }) {
  const items = [
    { symbol: '\u2694', label: 'Battle', border: '#7A1212' },
    { symbol: '\uD83D\uDCDC', label: 'Political', border: '#0A244A' },
    { symbol: '\uD83E\uDD1D', label: 'Diplomatic', border: '#C5A02F' },
  ];

  const sides = [
    { color: '#1e3a5f', label: 'American' },
    { color: '#8b2323', label: 'British' },
  ];

  return (
    <div className={`map-legend ${darkMode ? 'dark' : ''}`}>
      <h4>Legend</h4>
      {items.map((item, i) => (
        <div key={i} className="legend-item">
          <span className="legend-symbol" style={{ borderColor: item.border }}>{item.symbol}</span>
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
  scrollWheelZoom = false
}) {
  const activeEvent = events.find(e => e.id === activeEventId);
  const activeEventDate = activeEvent ? new Date(activeEvent.date) : null;
  const center = activeEvent
    ? [activeEvent.lat, activeEvent.lng + 3]
    : [40.0, -74.0];
  const zoom = activeEvent ? 6 : 5;

  const terrainUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
  const darkTerrainUrl = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

  const visibleEvents = events.filter(event => {
    if (!hideFutureEvents) return true;
    if (!activeEventDate) return true;
    return new Date(event.date) <= activeEventDate;
  });

  const isFutureEvent = (event) => {
    if (!activeEventDate) return false;
    return new Date(event.date) > activeEventDate;
  };

  return (
    <div className={`map-container ${darkMode ? 'dark' : 'light'}`}>
      <MapContainer
        center={[40.0, -74.0]}
        zoom={5}
        minZoom={4}
        maxBounds={easternSeaboardBounds}
        maxBoundsViscosity={0.8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={scrollWheelZoom}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
      >
        {darkMode ? (
          <TileLayer
            url={darkTerrainUrl}
            attribution='&copy; OpenStreetMap &copy; CARTO'
            subdomains="abcd"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            url={terrainUrl}
            attribution='Tiles &copy; Esri &mdash; Source: Esri, USGS'
            maxZoom={13}
            className="colonial-tiles"
          />
        )}

        <MapController center={center} zoom={zoom} autoFly={autoFly} />

        {showColonies && colonyBoundaries && (
          <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} fillColonies={fillColonies} />
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
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createEventIcon(event.type, event.side, event.id === activeEventId, isFutureEvent(event), proximity)}
              eventHandlers={{
                click: () => onEventClick(event.id)
              }}
            />
          );
        })}
      </MapContainer>
      <MapLegend darkMode={darkMode} />
    </div>
  );
}
