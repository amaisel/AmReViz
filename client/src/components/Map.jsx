import { useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';
import { MapContainer, Marker, Polyline, useMap, GeoJSON, Pane } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { landAreas, lakes, rivers, europeLand } from '../data/geo/baseMap';
import { MOBILE_SHEET_PEEK_RATIO } from '../constants/layout';
import { EVENT_TYPES, typeTheme, SIDES } from '../constants/palette';
import useReducedMotion from '../hooks/useReducedMotion';

// One renderer per pane, not one for the whole chart.
//
// A single shared renderer puts every path in one SVG under `overlayPane`,
// which makes the panes below decorative: paint order becomes DOM order, and
// DOM order is whatever sequence the layers happened to mount in. Toggling
// dark mode remounts the base layers (they are keyed on it), which re-appended
// the opaque land fill above the colony borders and erased every state line.
//
// Binding a renderer to a pane restores the z-index as the thing that decides,
// so a remount cannot reorder one group past another.
const chartRenderer = (pane) => L.svg({ padding: 0.1, pane });
const GRATICULE_SVG = chartRenderer('graticule');
const LAND_SVG = chartRenderer('base-land');
const COLONY_SVG = chartRenderer('colonies');
const WATER_SVG = chartRenderer('base-water');

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

// Which side prevailed is drawn on the map as a fill colour and nothing else.
// Navy against crimson survives most colour vision, but it sits at 64 in RGB
// distance under protanopia, and a reader using a screen reader has no access
// to it at all. Saying it in the marker's accessible name costs nothing and
// removes the dependence on colour outright.
const SIDE_LABELS = {
  american: 'American-held',
  british: 'British-held',
};

const createEventIcon = (event, isActive, isFuture = false, proximity = 1.0) => {
  const { type, side } = event;

  // Depth-of-field: markers far from active shrink and fade
  const depthScale = isActive ? 1 : (0.65 + 0.35 * proximity);
  const baseSize = isActive ? 44 : 34;
  const size = Math.round(baseSize * depthScale);
  const depthOpacity = isFuture ? 0.2 : (isActive ? 1 : (0.45 + 0.55 * proximity));
  const borderColor = SIDES[side] || SIDES.american;
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
          aria-label="${event.title}${event.date ? `, ${new Date(event.date).getUTCFullYear()}` : ''}${SIDE_LABELS[side] ? `, ${SIDE_LABELS[side]}` : ''}"
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
  const stableProximity = Math.round(proximity * 100) / 100;
  const icon = useMemo(() => {
    return createEventIcon(event, isActive, isFuture, stableProximity);
  }, [event, isActive, isFuture, stableProximity]);

  return (
    <Marker
      position={[event.lat, event.lng]}
      icon={icon}
      zIndexOffset={isActive ? 1000 : 0}
      // The icon's inner <div role="button"> carries focus and the label.
      // Leaflet's own keyboard handling would put tabindex on the wrapper
      // too, nesting one interactive element inside another.
      keyboard={false}
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

function InvalidateOnVisible({ mapVisible }) {
  const map = useMap();
  useEffect(() => {
    if (!mapVisible) return;
    const id = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [mapVisible, map]);
  return null;
}

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

      // Steps run up to 2000 so the Atlantic frame has an honest rung to land
      // on. Capped at 500, the bar bottomed out on the 40px floor below and
      // then labelled that floor "500 mi", which was roughly half the truth.
      const niceSteps = [2000, 1000, 500, 200, 100, 50, 25, 10, 5];
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

function MapController({ center, zoom, autoFly, coveredRatio = 0, maxBounds, minZoom, fitBounds }) {
  const map = useMap();
  const prevCenterRef = useRef(null);
  const prevZoomRef = useRef(null);
  const [resizeTick, setResizeTick] = useState(0);
  // A 2.4s flight across the Atlantic is exactly the kind of large-area motion
  // the preference exists to suppress; the destination is what carries the
  // meaning, so reduced motion cuts to it rather than slowing it down.
  const reduceMotion = useReducedMotion();

  // The container is usually still laying out when the first positioning runs,
  // so `getSize()` under-reports and the offset that lifts the target clear of
  // the bottom sheet comes out proportionally short — on a phone that left the
  // marker straddling the sheet edge. Re-aim once the real size is known.
  useEffect(() => {
    const reaim = () => {
      prevCenterRef.current = null;
      setResizeTick((t) => t + 1);
    };
    map.on('resize', reaim);
    return () => { map.off('resize', reaim); };
  }, [map]);

  // MapContainer props are only read at mount, so the frame has to be
  // resized imperatively when the story crosses the Atlantic. This must
  // happen before the camera moves, or maxBounds clamps the flight.
  useEffect(() => {
    map.setMinZoom(minZoom);
    map.setMaxBounds(maxBounds);
  }, [map, maxBounds, minZoom]);

  useEffect(() => {
    if (!autoFly || !center) return;

    const prevCenter = prevCenterRef.current;
    const prevZoom = prevZoomRef.current;

    // Avoid jitter from floating-point / fractional-zoom noise
    const CENTER_EPS = 0.0001;
    const ZOOM_EPS = 0.05;
    const centerChanged = !prevCenter ||
      Math.abs(prevCenter[0] - center[0]) > CENTER_EPS ||
      Math.abs(prevCenter[1] - center[1]) > CENTER_EPS;
    const zoomChanged = prevZoom == null || Math.abs(prevZoom - zoom) > ZOOM_EPS;

    // Only re-aim when the story target moves — not when coveredRatio alone changes
    // (interlude height jumps must not yank the camera).
    if (!centerChanged && !zoomChanged) return;

    // Aim at the visible strip above the bottom card/sheet.
    const offsetPx = (map.getSize().y * coveredRatio) / 2;
    const target = map.unproject(
      map.project(center, zoom).add([0, offsetPx]),
      zoom
    );

    const dist = prevCenter
      ? Math.hypot(prevCenter[0] - center[0], prevCenter[1] - center[1])
      : 0;

    map.stop();

    const bottomPadding = [0, Math.round(map.getSize().y * coveredRatio)];

    if (prevCenter == null || reduceMotion) {
      // First positioning — a deep link, or the first render — or a reader who
      // asked for reduced motion. Land on the target immediately: a 2.4s
      // flight in from the default centre is wasted motion, and `panTo`
      // cannot change zoom, which a deep link straight to an overseas event
      // needs it to.
      if (fitBounds) {
        map.fitBounds(fitBounds, { paddingBottomRight: bottomPadding, animate: false });
      } else {
        map.setView(target, zoom, { animate: false });
      }
    } else if (fitBounds) {
      // Overseas target: frame the whole crossing rather than the point.
      map.flyToBounds(fitBounds, {
        duration: 2.4,
        easeLinearity: 0.25,
        paddingBottomRight: bottomPadding,
      });
    } else if (zoomChanged) {
      // Coming back from overseas. flyTo has to reproject every path per
      // frame, which is why it is reserved for the handful of steps a
      // same-zoom pan cannot reach at all.
      map.flyTo(target, zoom, { duration: 2.4, easeLinearity: 0.25 });
    } else {
      // Short same-zoom pan. Geo is simplified and zoom is fixed, so mid-pan
      // path updates stay cheap enough to feel smooth without half-drawn coasts.
      map.panTo(target, {
        animate: true,
        duration: Math.min(0.4, 0.2 + dist * 0.035),
        easeLinearity: 0.4,
      });
    }

    prevCenterRef.current = center;
    prevZoomRef.current = zoom;
  }, [center, zoom, map, autoFly, coveredRatio, fitBounds, resizeTick, reduceMotion]);

  return null;
}

// True while the chart is wider than the seaboard frame. Returns a boolean
// rather than the zoom itself so crossing the threshold is the only thing
// that re-renders the base chart.
const INLAND_DETAIL_ZOOM = 5;

function useIsWideFrame() {
  const map = useMap();
  const [wide, setWide] = useState(() => map.getZoom() < INLAND_DETAIL_ZOOM);

  useEffect(() => {
    const update = () => setWide(map.getZoom() < INLAND_DETAIL_ZOOM);
    map.on('zoomend', update);
    update();
    return () => { map.off('zoomend', update); };
  }, [map]);

  return wide;
}

// Base chart: one land fill+stroke, lakes, rivers. Extra SVG copies of the
// coast were the main cost when Leaflet rewrote path `d` on pan.
const BaseChart = memo(({ darkMode, showEurope }) => {
  const coastInk = darkMode ? '#9aafd4' : '#4A3828';
  const landFill = darkMode ? '#2a3555' : '#FAF6EA';
  const waterFill = darkMode ? '#12182a' : '#D4C4A0';
  const riverInk = darkMode ? '#7d92be' : '#6B5840';

  // Lakes and river centrelines are surveyed for zoom 5–7. Out over the
  // Atlantic they collapse into speckle inside the silhouette, so the
  // crossing frame drops them and reads as a clean ocean chart.
  const wideFrame = useIsWideFrame();

  return (
    <>
      <Pane name="base-land" style={{ zIndex: 300 }}>
        <GeoJSON
          key={`land-${darkMode}`}
          data={landAreas}
          interactive={false}
          renderer={LAND_SVG}
          style={{
            fillColor: landFill,
            fillOpacity: 1,
            color: coastInk,
            weight: 1.5,
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round',
          }}
          smoothFactor={2.5}
        />
        {/* Mounted only for the crossing — at seaboard zoom it is off-frame
            geometry that Leaflet would still reproject on every pan. */}
        {showEurope && (
          <GeoJSON
            key={`europe-${darkMode}`}
            data={europeLand}
            interactive={false}
            renderer={LAND_SVG}
            style={{
              fillColor: landFill,
              fillOpacity: 1,
              color: coastInk,
              weight: 1.5,
              opacity: 1,
              lineJoin: 'round',
              lineCap: 'round',
              className: 'europe-coast',
            }}
            smoothFactor={2.5}
          />
        )}
      </Pane>

      {!wideFrame && (
      <Pane name="base-water" style={{ zIndex: 320 }}>
        <GeoJSON
          key={`lakes-${darkMode}`}
          data={lakes}
          interactive={false}
          renderer={WATER_SVG}
          style={{
            fillColor: waterFill,
            fillOpacity: 1,
            color: coastInk,
            weight: 0.8,
            opacity: 0.85,
          }}
          smoothFactor={2.5}
        />
        <GeoJSON
          key={`rivers-${darkMode}`}
          data={rivers}
          interactive={false}
          renderer={WATER_SVG}
          style={{
            fill: false,
            color: riverInk,
            weight: 1.2,
            opacity: darkMode ? 0.65 : 0.75,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          smoothFactor={2.5}
        />
      </Pane>
      )}
    </>
  );
});

// Faint survey graticule with edge ticks, like an 18th-century chart
const Graticule = memo(({ darkMode, atlantic }) => {
  const lines = useMemo(() => {
    const out = [];
    // The crossing frame needs meridians all the way to the far shore,
    // otherwise the grid stops mid-ocean and the Atlantic reads as a void.
    const [latStep, lngStep] = atlantic ? [6, 10] : [4, 4];
    // Seaboard extents track the land silhouette, which now runs to -102 so
    // its clipped edge stays off-viewport; a grid that stopped short of the
    // coast would just relocate the visible edge.
    const [west, east] = atlantic ? [-90, 10] : [-102, -52];
    const [south, north] = atlantic ? [22, 60] : [20, 55];
    for (let lat = Math.ceil(south / latStep) * latStep; lat <= north; lat += latStep) {
      out.push([[lat, west], [lat, east]]);
    }
    for (let lng = Math.ceil(west / lngStep) * lngStep; lng <= east; lng += lngStep) {
      out.push([[south, lng], [north, lng]]);
    }
    return out;
  }, [atlantic]);

  const color = darkMode ? '#8fa1c9' : '#7d6a4f';

  return (
    <Pane name="graticule" style={{ zIndex: 290 }}>
      {lines.map((pts, i) => (
        <Polyline
          key={`${atlantic ? 'atl' : 'sea'}-${i}`}
          positions={pts}
          interactive={false}
          renderer={GRATICULE_SVG}
          pathOptions={{ color, weight: 0.5, opacity: darkMode ? 0.1 : 0.12, dashArray: '2 6' }}
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

// The colonies are scene-setting, not a data layer: they carry no statistics
// and are inert to the pointer. Hovering one used to raise a tooltip of
// population and export figures; with those gone there is nothing to reveal,
// so there is no hover state and no per-feature handler either.
const ColonyBoundaries = memo(({ boundaries, darkMode, fillColonies }) => {
  const style = useCallback((feature) => {
    const colonyName = feature.properties.name;

    // Period chart palette: sepia ink on parchment / gold ink on midnight.
    // The dark stroke is lifted well clear of the land fill it sits on —
    // #C5A02F at low opacity read as nothing against #2a3555.
    const strokeColorLight = '#5B4636';
    const strokeColorDark = '#E8C976';

    if (fillColonies) {
      return {
        fillColor: colonyColors[colonyName] || (darkMode ? '#E0C060' : '#B99C6B'),
        weight: 1.2,
        opacity: darkMode ? 0.85 : 0.8,
        color: darkMode ? strokeColorDark : strokeColorLight,
        fillOpacity: 0.3,
        dashArray: null
      };
    }

    // Outline mode (default): hand-tinted political wash + fine engraved
    // borders. "Fine" used to mean 0.65px at 55–60% opacity, which is below
    // what a display can actually resolve: the colony lines were invisible in
    // dark mode and faded out on zooming away in light. An engraved line still
    // has to be a line.
    return {
      fillColor: colonyColors[colonyName] || (darkMode ? '#E0C060' : '#C8B085'),
      weight: 1.1,
      opacity: darkMode ? 0.8 : 0.75,
      color: darkMode ? strokeColorDark : strokeColorLight,
      fillOpacity: darkMode ? 0.1 : 0.13,
      dashArray: null,
      className: 'colony-boundary'
    };
  }, [darkMode, fillColonies]);

  return (
    <GeoJSON
      data={boundaries}
      style={style}
      interactive={false}
      renderer={COLONY_SVG}
      smoothFactor={2.5}
    />
  );
});

function ColonyLabels({ boundaries, darkMode }) {
  // Static positions — avoiding per-event label nudging prevents icon
  // recreation on every story hop.
  //
  // Dropped in the Atlantic frame: thirteen abbreviations over a coastline
  // rendered two hundred pixels wide is a smudge, not a label.
  const wideFrame = useIsWideFrame();
  if (wideFrame) return null;

  return (
    <>
      {boundaries.features.map((feature) => {
        const props = feature.properties;
        if (!props.labelLat || !props.labelLng) return null;

        return (
          <Marker
            key={`label-${props.name}`}
            position={[props.labelLat, props.labelLng]}
            icon={createColonyLabel(props.abbrev, darkMode)}
            interactive={false}
            // `interactive: false` only stops mouse handlers. Leaflet still
            // stamps role="button" and tabindex="0" on the icon while
            // `keyboard` is on, which put every decorative label in the tab
            // order ahead of the markers that actually do something.
            keyboard={false}
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

// The crossing frame replaces the label set rather than adding to it. At zoom
// 3 the seaboard labels collapse into an illegible knot over a shape the size
// of a thumbnail, and the ocean label — angled for a coastal view — ends up
// lying across New England.
const atlanticLabels = [
  { text: 'ATLANTIC OCEAN', lat: 41.5, lng: -42.0, kind: 'sea', rotate: 0 },
  { text: 'GREAT BRITAIN', lat: 57.6, lng: -4.2, kind: 'territory', rotate: 0 },
  { text: 'FRANCE', lat: 45.4, lng: 2.5, kind: 'territory', rotate: 0 },
  { text: 'SPAIN', lat: 40.0, lng: -3.7, kind: 'territory', rotate: 0 },
];

const PeriodLabels = memo(({ darkMode, atlantic }) => (
  <Pane name="period-labels" style={{ zIndex: 340 }}>
    {(atlantic ? atlanticLabels : periodLabels).map((label) => (
      <Marker
        key={label.text}
        position={[label.lat, label.lng]}
        interactive={false}
        keyboard={false}
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

// Chronology annotations along the story so far.
//
// This used to draw a connecting line between consecutive events. It was
// removed: nobody travelled Savannah → Charleston → Camden as one march, so a
// drawn segment asserted a journey that never happened — and across the
// Atlantic it degenerated into a rubber band from Yorktown to Paris. What is
// worth keeping is the year each new campaign season opens, pinned to the
// place it opened at.
const TrailYearMarkers = memo(({ events, activeEventId, darkMode }) => {
  const activeIndex = useMemo(
    () => events.findIndex(e => e.id === activeEventId),
    [events, activeEventId]
  );
  const visibleEvents = useMemo(
    () => (activeIndex < 1 ? [] : events.slice(0, activeIndex + 1)),
    [events, activeIndex]
  );

  return useMemo(() => {
    if (visibleEvents.length < 2) return null;

    const yearMarkers = [];
    let lastYear = new Date(visibleEvents[0].date).getUTCFullYear();

    for (let i = 1; i < visibleEvents.length; i++) {
      const eventYear = new Date(visibleEvents[i].date).getUTCFullYear();
      if (eventYear !== lastYear) {
        yearMarkers.push(
          <Marker
            key={`year-${eventYear}-${visibleEvents[i].id}`}
            position={[visibleEvents[i].lat, visibleEvents[i].lng]}
            icon={L.divIcon({
              className: 'trail-year-marker',
              html: `<span class="${darkMode ? 'dark' : ''}">${eventYear}</span>`,
              iconSize: [36, 16],
              iconAnchor: [18, -6],
            })}
            interactive={false}
            keyboard={false}
          />
        );
      }
      lastYear = eventYear;
    }
    return <>{yearMarkers}</>;
  }, [visibleEvents, darkMode]);
});

function MapLegend({ darkMode, timelineOpen }) {
  const items = Object.entries(EVENT_TYPES).map(([type, meta]) => ({
    type,
    label: meta.label,
    border: typeTheme(type, darkMode).hue,
  }));

  const sides = [
    { color: SIDES.american, label: 'American' },
    { color: SIDES.british, label: 'British' },
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

// West edge reaches -91 so the Gulf campaign at Pensacola (-87.2) is inside
// the frame. The land data runs to -95, so the silhouette still has no
// visible edge at minZoom.
const easternSeaboardBounds = [
  [27.0, -91.0],
  [48.0, -60.0]
];

// Four events in the chronology happen in Europe — London twice, Paris twice.
// Panning to them is impossible inside the seaboard frame, so the map
// temporarily widens to an Atlantic view and flies across.
//
// Deliberately loose, and loosest to the south. Lifting the target clear of
// the phone's bottom sheet moves the map *centre* southward, so it is the
// south edge that binds: at 15°N the view stuck fast there and the marker
// came to rest straddling the sheet it was supposed to clear. Nothing is
// drawn down here, so the slack costs only blank sea if a reader pans into it.
const atlanticBounds = [
  [-10.0, -100.0],
  [70.0, 22.0]
];

// A European target centred on its own would fill the frame with open water.
// Framing the whole crossing puts both shores on screen, which is the point:
// these are decisions taken an ocean away from the fighting.
const atlanticCrossingBounds = [
  [34.0, -80.0],
  [55.0, 8.0]
];

const SEABOARD_ZOOM = 6;

// The phone keeps the desktop seaboard zoom. Dropping it to 5 shows more of the
// theatre, but `easternSeaboardBounds` spans 27–48°N, which is only ~610px tall
// in Mercator at zoom 5 against ~1220px at zoom 6. Any viewport taller than that
// box cannot be panned at all, so the offset that lifts the active event clear
// of the bottom sheet is silently discarded: the marker sank from 37px below the
// strip centre to 108px on a 390x844, and to 225px on a 754x1254. Widening the
// bounds northward is the only way to buy the wider frame, and that exposes the
// clipper's straight cut as a false coastline.
const ATLANTIC_MIN_ZOOM = 3;

// A phone cannot hold the crossing. Fitting 88° of longitude into ~390px needs
// zoom 2.6, below the floor, so `flyToBounds` bottoms out at 3 and centres on
// open ocean with the target a pixel off the right edge. Europe now carries its
// own coastline — which was the only reason to frame both shores at all — so
// the narrow layout flies to the target itself and lands on France or Britain.
const OVERSEAS_MOBILE_ZOOM = 4;

// Anything east of mid-ocean is across the Atlantic. Testing against the
// seaboard rectangle instead would misclassify Gulf-coast events as overseas
// and fly the map to an empty stretch of sea.
const ATLANTIC_MERIDIAN = -30.0;

function isAcrossTheAtlantic(lng) {
  return lng > ATLANTIC_MERIDIAN;
}

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
  mapVisible = true,
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
  // Cartouche flips after Independence is declared (July 4, 1776).
  const isUnitedStates = activeEventDate != null && activeEventDate >= new Date('1776-07-04');
  const center = activeEvent
    ? [activeEvent.lat, activeEvent.lng]
    : [40.0, -74.0];

  // Fixed integer zoom: any zoom change forces Leaflet to reproject every SVG
  // path `d` attribute (~50+ paths). Keeping zoom constant lets pans CSS-
  // transform the chart instead — that was the remaining lag on northbound hops.
  // The one exception is a target off the seaboard, which needs a wider frame.
  const isOverseas = activeEvent != null && isAcrossTheAtlantic(activeEvent.lng);
  const zoom = isOverseas
    ? (isMobile ? OVERSEAS_MOBILE_ZOOM : ATLANTIC_MIN_ZOOM)
    : SEABOARD_ZOOM;
  const maxBounds = isOverseas ? atlanticBounds : easternSeaboardBounds;
  const minZoom = isOverseas ? ATLANTIC_MIN_ZOOM : 5;
  const fitBounds = isOverseas && !isMobile ? atlanticCrossingBounds : null;

  // The mobile bottom sheet covers part of the map; desktop uses a side rail.
  const coveredRatio = isMobile ? MOBILE_SHEET_PEEK_RATIO : 0;

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
        <span className="cartouche-ornament" />
        <span className="cartouche-title">
          {isUnitedStates ? 'The United States of America' : 'The British Colonies'}
        </span>
        <span className="cartouche-subtitle">
          {isUnitedStates ? 'Declared July 4, 1776' : 'in North America'}
        </span>
        <span className="cartouche-ornament" />
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
        {isUnitedStates
          ? 'Surveyed after ye best Authorities · MDCCLXXVI'
          : 'Surveyed after ye best Authorities · MDCCLXXV'}
      </p>
      <MapContainer
        center={[40.0, -74.0]}
        zoom={SEABOARD_ZOOM}
        // MapController keeps minZoom/maxBounds in sync from here on; these
        // are only the mount-time values.
        minZoom={5}
        maxZoom={7}
        maxBounds={easternSeaboardBounds}
        maxBoundsViscosity={0.8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
        scrollWheelZoom={scrollWheelZoom}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        preferCanvas={false}
        // No map-wide renderer: every vector layer names the renderer bound to
        // its own pane, so ordering is decided by z-index rather than by which
        // layer happened to mount last.
      >
        {/* No tile layer: the map renders as a period parchment chart —
            the CSS paper is the sea, and accurate Natural Earth land/lake/
            river geometry is drawn on it in engraved-chart style */}
        <MapController
          center={center}
          zoom={zoom}
          autoFly={autoFly}
          coveredRatio={coveredRatio}
          maxBounds={maxBounds}
          minZoom={minZoom}
          fitBounds={fitBounds}
        />
        <InvalidateOnVisible mapVisible={mapVisible} />
        <ScaleBarControl darkMode={darkMode} />

        <Graticule darkMode={darkMode} atlantic={isOverseas} />
        <BaseChart darkMode={darkMode} showEurope={isOverseas} />
        <PeriodLabels darkMode={darkMode} atlantic={isOverseas} />

        {showColonies && colonyBoundaries && (
          <>
            {/* Between the land silhouette (300) and lakes/rivers (320) so
                the political wash never tints the water */}
            <Pane name="colonies" style={{ zIndex: 310 }}>
              <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} fillColonies={fillColonies} />
            </Pane>
            <ColonyLabels boundaries={colonyBoundaries} darkMode={darkMode} />
          </>
        )}

        <TrailYearMarkers events={events} activeEventId={activeEventId} darkMode={darkMode} />

        {visibleEvents.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            isActive={event.id === activeEventId}
            isFuture={isFutureEvent(event)}
            // Fixed proximity — per-hop distance recalculation rebuilt every
            // marker's HTML icon and was a major source of hop jank.
            proximity={event.id === activeEventId ? 1 : 0.75}
            onClick={() => handleEventClick(event.id)}
          />
        ))}
      </MapContainer>
    </div>
  );
}
