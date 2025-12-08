import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createEventIcon = (type, side, isActive, isFuture = false) => {
  const colors = {
    american: '#1e3a5f',
    british: '#8b2323'
  };
  
  const symbols = {
    battle: '⚔',
    political: '📜',
    diplomatic: '🤝'
  };

  const size = isActive ? 44 : 34;
  const opacity = isFuture ? 0.35 : 1;
  const borderColor = colors[side] || '#1e3a5f';
  const bgColor = isActive ? borderColor : '#fffef5';
  const textColor = isActive ? '#fffef5' : borderColor;
  const shadowOpacity = isFuture ? 0.15 : 0.35;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bgColor};
        border: 3px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size * 0.45}px;
        box-shadow: 0 3px 10px rgba(0,0,0,${shadowOpacity});
        transition: all 0.3s ease;
        cursor: pointer;
        opacity: ${opacity};
      ">
        <span style="color: ${textColor};">${symbols[type] || '●'}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
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
        map.flyTo(center, zoom, {
          duration: 1.2,
          easeLinearity: 0.25
        });
        prevCenterRef.current = center;
      }
    }
  }, [center, zoom, map, autoFly]);
  
  return null;
}

function ColonyBoundaries({ boundaries, darkMode }) {
  const [hoveredColony, setHoveredColony] = useState(null);

  const style = (feature) => ({
    fillColor: darkMode ? 'rgba(139, 35, 35, 0.15)' : 'rgba(30, 58, 95, 0.08)',
    weight: 2,
    opacity: 0.8,
    color: darkMode ? 'rgba(200, 180, 160, 0.6)' : 'rgba(101, 67, 33, 0.5)',
    fillOpacity: hoveredColony === feature.properties.name ? 0.3 : 0.1,
    dashArray: '4, 4'
  });

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
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '4, 4'
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

function ColonyLabels({ boundaries, darkMode }) {
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
          />
        );
      })}
    </>
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
  darkMode,
  autoFly = true,
  hideFutureEvents = false
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
          <>
            <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} />
            <ColonyLabels boundaries={colonyBoundaries} darkMode={darkMode} />
          </>
        )}
        
        {visibleEvents.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={createEventIcon(event.type, event.side, event.id === activeEventId, isFutureEvent(event))}
            eventHandlers={{
              click: () => onEventClick(event.id)
            }}
          >
            <Popup className="vintage-popup">
              <div style={{ 
                fontFamily: 'Georgia, serif',
                maxWidth: '250px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1e3a5f' }}>
                  {event.title}
                </h3>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  margin: '0 0 8px 0'
                }}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p style={{ 
                  fontSize: '13px',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {event.description.substring(0, 150)}...
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
