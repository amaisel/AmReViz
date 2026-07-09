import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { MapContainer, Marker, Polyline, useMap, GeoJSON, Pane } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { landAreas, lakes, rivers } from '../data/geo/baseMap';

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
  const { type, side } = event;
  const colors = {
    american: '#1e3a5f',
    british: '#8b2323'
  };

  // Depth-of-field: markers far from active shrink and fade
  const depthScale = isActive ? 1 : (0.65 + 0.35 * proximity);
  const baseSize = isActive ? 44 : 34;
  const size = Math.round(baseSize * depthScale);
  const depthOpacity = isFuture ? 0.2 : (isActive ? 1 : (0.45 + 0.55 * proximity));
  const borderColor = colors[side] || '#1e3a5f';
  const bgColor = isActive ? borderColor : '#fffef5';
  const textColor = isActive ? '#fffef5' : borderColor;
  const shadowOpacity = isFuture ? 0.08 : (isActive ? 0.45 : 0.12 * proximity);
  const shadowBlur = isActive ? 14 : Math.round(5 * proximity);
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
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${pulseRing}
        <div
          role="button"
          tabindex="0"
          aria-label="${event.title}${event.date ? `, ${new Date(event.date).getUTCFullYear()}` : ''}"
          style="
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
          <div style="width: ${symbolSize}px; height: ${symbolSize}px;">${getSymbolSvg(type, textColor)}</div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Memoized Event Marker to prevent flickering
const EventMarker = memo(({ event, isActive, isFuture, proximity, onClick }) => {
  const proximityBucket = Math.round(proximity * 100);
  const icon = useMemo(() => {
    return createEventIcon(event, isActive, isFuture, proximity);
  }, [event, isActive, isFuture, proximityBucket]);

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
  const textColor = darkMode ? 'rgba(220, 200, 180, 0.92)' : 'rgba(55, 38, 22, 0.88)';
  const shadowColor = darkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 252, 245, 0.95)';

  return L.divIcon({
    className: 'colony-label',
    html: `
      <div style="
        font-family: 'Playfair Display', Georgia, serif;
        font-size: 11px;
        font-weight: 600;
        font-style: italic;
        color: ${textColor};
        text-shadow: 
          0 0 3px ${shadowColor},
          1px 1px 1px ${shadowColor},
          -1px -1px 1px ${shadowColor};
        white-space: nowrap;
        letter-spacing: 0.18em;
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

function ScaleBarControl({ darkMode }) {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'bottomleft' });
    let graphicEl;
    let labelEl;

    const update = () => {
      const y = map.getSize().y / 2;
      const latlng1 = map.containerPointToLatLng([0, y]);
      const latlng2 = map.containerPointToLatLng([100, y]);
      const meters = latlng1.distanceTo(latlng2);
      const miles = meters / 1609.34;

      const niceSteps = [500, 200, 100, 50, 25, 10, 5];
      const niceMiles = niceSteps.find((s) => s <= miles * 1.15) || 5;
      const px = Math.max(40, Math.min(140, (niceMiles / miles) * 100));

      if (graphicEl) graphicEl.style.width = `${px}px`;
      if (labelEl) labelEl.textContent = `${niceMiles} mi`;
    };

    control.onAdd = () => {
      const div = L.DomUtil.create('div', `map-scale-bar ${darkMode ? 'dark' : ''}`);
      graphicEl = L.DomUtil.create('div', 'scale-bar-graphic', div);
      L.DomUtil.create('span', 'scale-bar-tick left', graphicEl);
      L.DomUtil.create('span', 'scale-bar-tick right', graphicEl);
      L.DomUtil.create('span', 'scale-bar-line', graphicEl);
      labelEl = L.DomUtil.create('span', 'scale-bar-label', div);
      labelEl.textContent = '—';
      return div;
    };

    control.addTo(map);
    map.on('zoomend moveend resize', update);
    update();

    return () => {
      map.off('zoomend moveend resize', update);
      control.remove();
    };
  }, [map, darkMode]);

  return null;
}

function MapController({ center, zoom, autoFly, coveredRatio = 0 }) {
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
        // The bottom of the viewport is covered by the sheet/card, so aim the
        // camera at the visible strip: shift the map center down in pixel
        // space by half the covered height, which lands the target at the
        // center of what the user can actually see.
        const offsetPx = (map.getSize().y * coveredRatio) / 2;
        const target = map.unproject(
          map.project(center, zoom).add([0, offsetPx]),
          zoom
        );

        // If moving a significant distance, use flyTo for smoothness
        const dist = prevCenter ? Math.sqrt(Math.pow(prevCenter[0] - center[0], 2) + Math.pow(prevCenter[1] - center[1], 2)) : 0;
        
        if (dist > 2) {
          map.flyTo(target, zoom, {
            duration: 0.8,
            easeLinearity: 0.25
          });
        } else {
          map.setView(target, zoom, {
            animate: true,
            duration: 0.4
          });
        }
        
        prevCenterRef.current = center;
        prevZoomRef.current = zoom;
      }
    }
  }, [center, zoom, map, autoFly, coveredRatio]);

  return null;
}

// Base chart: accurate land silhouette, lakes, and rivers rendered in the
// style of an engraved 1770s chart. The "waterlines" effect — concentric
// strokes hugging the coast — is how period engravers indicated the sea.
const BaseChart = memo(({ darkMode }) => {
  const coastInk = darkMode ? '#9aafd4' : '#4A3828';
  const coastShadow = darkMode ? '#0a0e18' : '#3D2E1F';
  const landFill = darkMode ? '#2a3555' : '#FAF6EA';
  const landHighlight = darkMode ? '#3a4668' : '#FFFDF7';
  const waterFill = darkMode ? '#12182a' : '#D4C4A0';
  const riverInk = darkMode ? '#7d92be' : '#6B5840';
  const riverGlow = darkMode ? '#4a5f8a' : '#A89878';

  const waterlineRings = [
    { weight: 18, opacity: darkMode ? 0.04 : 0.035 },
    { weight: 13, opacity: darkMode ? 0.06 : 0.055 },
    { weight: 9, opacity: darkMode ? 0.09 : 0.085 },
    { weight: 5.5, opacity: darkMode ? 0.14 : 0.13 },
    { weight: 3, opacity: darkMode ? 0.22 : 0.2 },
    { weight: 1.4, opacity: darkMode ? 0.32 : 0.3 },
  ];

  return (
    <>
      <Pane name="base-coast-shadow" style={{ zIndex: 294 }}>
        <GeoJSON
          key={`shadow-${darkMode}`}
          data={landAreas}
          interactive={false}
          style={{
            fill: false,
            color: coastShadow,
            weight: 3.5,
            opacity: darkMode ? 0.35 : 0.18,
            lineJoin: 'round',
            lineCap: 'round',
          }}
          smoothFactor={1.0}
        />
      </Pane>

      <Pane name="base-waterlines" style={{ zIndex: 296 }}>
        {waterlineRings.map((ring, i) => (
          <GeoJSON
            key={`wl-${i}-${darkMode}`}
            data={landAreas}
            interactive={false}
            style={{
              fill: false,
              color: coastInk,
              weight: ring.weight,
              opacity: ring.opacity,
              lineJoin: 'round',
              lineCap: 'round',
            }}
            smoothFactor={1.0}
          />
        ))}
      </Pane>

      <Pane name="base-land" style={{ zIndex: 300 }}>
        <GeoJSON
          key={`land-${darkMode}`}
          data={landAreas}
          interactive={false}
          style={{
            fillColor: landFill,
            fillOpacity: 1,
            color: coastInk,
            weight: 1.4,
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round',
          }}
          smoothFactor={1.0}
        />
        <GeoJSON
          key={`land-hi-${darkMode}`}
          data={landAreas}
          interactive={false}
          style={{
            fill: false,
            color: landHighlight,
            weight: 0.6,
            opacity: darkMode ? 0.25 : 0.5,
            lineJoin: 'round',
          }}
          smoothFactor={1.0}
        />
      </Pane>

      <Pane name="base-water" style={{ zIndex: 320 }}>
        <GeoJSON
          key={`lakes-${darkMode}`}
          data={lakes}
          interactive={false}
          style={{
            fillColor: waterFill,
            fillOpacity: 1,
            color: coastInk,
            weight: 0.9,
            opacity: 0.85,
          }}
          smoothFactor={1.0}
        />
        <GeoJSON
          key={`rivers-glow-${darkMode}`}
          data={rivers}
          interactive={false}
          style={{
            fill: false,
            color: riverGlow,
            weight: 2.8,
            opacity: darkMode ? 0.18 : 0.22,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          smoothFactor={1.0}
        />
        <GeoJSON
          key={`rivers-${darkMode}`}
          data={rivers}
          interactive={false}
          style={{
            fill: false,
            color: riverInk,
            weight: 1.1,
            opacity: darkMode ? 0.7 : 0.78,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          smoothFactor={1.0}
        />
      </Pane>
    </>
  );
});

// Faint survey graticule with edge ticks, like an 18th-century chart
const Graticule = memo(({ darkMode }) => {
  const { lines, latLabels, lngLabels } = useMemo(() => {
    const lines = [];
    const latLabels = [];
    const lngLabels = [];
    for (let lat = 26; lat <= 50; lat += 4) {
      lines.push([[lat, -95], [lat, -52]]);
      latLabels.push({ lat, lng: -94.2, text: `${lat}°` });
    }
    for (let lng = -92; lng <= -56; lng += 4) {
      lines.push([[24, lng], [52, lng]]);
      lngLabels.push({ lat: 24.6, lng, text: `${Math.abs(lng)}°W` });
    }
    return { lines, latLabels, lngLabels };
  }, []);

  const color = darkMode ? '#8fa1c9' : '#7d6a4f';
  const labelColor = darkMode ? 'rgba(143, 161, 201, 0.55)' : 'rgba(90, 70, 48, 0.55)';

  return (
    <Pane name="graticule" style={{ zIndex: 290 }}>
      {lines.map((pts, i) => (
        <Polyline
          key={i}
          positions={pts}
          interactive={false}
          pathOptions={{ color, weight: 0.5, opacity: darkMode ? 0.1 : 0.12, dashArray: '2 6' }}
        />
      ))}
      {[...latLabels, ...lngLabels].map((label) => (
        <Marker
          key={`grid-${label.text}-${label.lat}-${label.lng}`}
          position={[label.lat, label.lng]}
          interactive={false}
          icon={L.divIcon({
            className: 'graticule-label',
            html: `<span style="color:${labelColor}">${label.text}</span>`,
            iconSize: [36, 14],
            iconAnchor: [18, 7],
          })}
        />
      ))}
    </Pane>
  );
});

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
        weight: isHovered ? 1.6 : 0.9,
        opacity: darkMode ? 0.55 : 0.7,
        color: darkMode ? strokeColorDark : strokeColorLight,
        fillOpacity: isHovered ? 0.42 : 0.3,
        dashArray: null
      };
    }

    // Outline mode (default): hand-tinted political wash + fine engraved borders
    return {
      fillColor: colonyColors[colonyName] || (darkMode ? '#E0C060' : '#C8B085'),
      weight: isHovered ? 1.4 : 0.65,
      opacity: isHovered ? 0.95 : darkMode ? 0.55 : 0.6,
      color: darkMode ? strokeColorDark : strokeColorLight,
      fillOpacity: isHovered ? 0.28 : darkMode ? 0.1 : 0.13,
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
      mouseover: () => setHoveredColony(props.name),
      mouseout: () => setHoveredColony(null)
    });
  }, []);

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

// Engraved-chart annotations: the ocean name in spaced italic capitals,
// neighboring territories in small caps — typographic conventions of
// 18th-century English charts.
const periodLabels = [
  { text: 'ATLANTIC OCEAN', lat: 36.8, lng: -70.0, kind: 'sea', rotate: -52 },
  { text: 'Gulf of Maine', lat: 42.9, lng: -68.4, kind: 'sea-minor', rotate: -30 },
  { text: 'QUEBEC', lat: 47.3, lng: -75.5, kind: 'territory', rotate: 0 },
  { text: 'NOVA SCOTIA', lat: 45.2, lng: -63.3, kind: 'territory', rotate: 0 },
  { text: 'INDIAN RESERVE', lat: 39.5, lng: -83.9, kind: 'territory', rotate: -78 },
  { text: 'EAST FLORIDA', lat: 29.4, lng: -81.6, kind: 'territory', rotate: -62 },
];

const PeriodLabels = memo(({ darkMode }) => (
  <Pane name="period-labels" style={{ zIndex: 340 }}>
    {periodLabels.map((label) => (
      <Marker
        key={label.text}
        position={[label.lat, label.lng]}
        interactive={false}
        icon={L.divIcon({
          className: 'period-map-label',
          html: `<span class="period-label-text ${label.kind} ${darkMode ? 'dark' : ''}" style="transform: translate(-50%, -50%) rotate(${label.rotate}deg)">${label.text}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })}
      />
    ))}
  </Pane>
));

const TroopMovementLines = memo(({ events, activeEventId, darkMode }) => {
  const activeIndex = useMemo(
    () => events.findIndex(e => e.id === activeEventId),
    [events, activeEventId]
  );
  const visibleEvents = useMemo(
    () => (activeIndex < 1 ? [] : events.slice(0, activeIndex + 1)),
    [events, activeIndex]
  );
  const color = darkMode ? '#C5A02F' : '#0A244A';
  const headColor = darkMode ? '#E0C060' : '#1e3a5f';

  // Build segments with age-based opacity — hooks must run unconditionally
  const trail = useMemo(() => {
    if (visibleEvents.length < 2) return null;

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

  return trail;
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
  const center = activeEvent
    ? [activeEvent.lat, activeEvent.lng]
    : [40.0, -74.0];

  // Contextual zoom: when the story hops between nearby events (the Boston
  // cluster, Trenton/Princeton), zoom in so they resolve into distinct
  // places; long jumps stay wide so the journey reads on the map.
  const activeIdx = activeEvent ? events.findIndex(e => e.id === activeEventId) : -1;
  const prevEvent = activeIdx > 0 ? events[activeIdx - 1] : null;
  const hopDist = prevEvent && activeEvent
    ? Math.hypot(activeEvent.lat - prevEvent.lat, activeEvent.lng - prevEvent.lng)
    : Infinity;
  const zoom = activeEvent ? (hopDist < 2 ? 7 : 6) : 5;

  // Fraction of the viewport hidden behind the bottom sheet (mobile) or the
  // bottom event card (desktop); the camera aims at the strip above it.
  const coveredRatio = isMobile ? 0.55 : 0.45;

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
      <div className="map-ocean-hatch" aria-hidden="true" />
      <div className="map-chart-frame" aria-hidden="true">
        <span className="frame-corner tl" />
        <span className="frame-corner tr" />
        <span className="frame-corner bl" />
        <span className="frame-corner br" />
      </div>
      <div className={`map-cartouche ${darkMode ? 'dark' : ''}`} aria-hidden="true">
        <span className="cartouche-title">The British Colonies</span>
        <span className="cartouche-subtitle">in North America</span>
      </div>
      <svg className="map-compass-rose" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
        <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
        <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.5" />
        <path d="M50 6 L56 48 L50 54 L44 48 Z" fill="currentColor" opacity="0.9" />
        <path d="M50 94 L56 52 L50 46 L44 52 Z" fill="currentColor" opacity="0.35" />
        <path d="M6 50 L48 44 L54 50 L48 56 Z" fill="currentColor" opacity="0.35" />
        <path d="M94 50 L52 44 L46 50 L52 56 Z" fill="currentColor" opacity="0.35" />
        <path d="M22 22 L46 42 L42 46 Z" fill="currentColor" opacity="0.2" />
        <path d="M78 22 L58 42 L54 46 Z" fill="currentColor" opacity="0.2" />
        <path d="M22 78 L42 58 L46 54 Z" fill="currentColor" opacity="0.2" />
        <path d="M78 78 L58 58 L54 54 Z" fill="currentColor" opacity="0.2" />
        <text x="50" y="4" textAnchor="middle" fontSize="8" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fontWeight="600" fill="currentColor">N</text>
        <text x="50" y="99" textAnchor="middle" fontSize="6" fontFamily="Playfair Display, Georgia, serif" fill="currentColor" opacity="0.5">S</text>
        <text x="3" y="53" textAnchor="middle" fontSize="6" fontFamily="Playfair Display, Georgia, serif" fill="currentColor" opacity="0.5">W</text>
        <text x="97" y="53" textAnchor="middle" fontSize="6" fontFamily="Playfair Display, Georgia, serif" fill="currentColor" opacity="0.5">E</text>
      </svg>
      <p className={`map-attribution ${darkMode ? 'dark' : ''}`} aria-hidden="true">
        Surveyed after ye best Authorities · MDCCLXXV
      </p>
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
        preferCanvas={true}
      >
        {/* No tile layer: the map renders as a period parchment chart —
            the CSS paper is the sea, and accurate Natural Earth land/lake/
            river geometry is drawn on it in engraved-chart style */}
        <MapController center={center} zoom={zoom} autoFly={autoFly} coveredRatio={coveredRatio} />
        <ScaleBarControl darkMode={darkMode} />

        <Graticule darkMode={darkMode} />
        <BaseChart darkMode={darkMode} />
        <PeriodLabels darkMode={darkMode} />

        {showColonies && colonyBoundaries && (
          <>
            {/* Between the land silhouette (300) and lakes/rivers (320) so
                the political wash never tints the water */}
            <Pane name="colonies" style={{ zIndex: 310 }}>
              <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} fillColonies={fillColonies} />
            </Pane>
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
