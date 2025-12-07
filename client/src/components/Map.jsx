import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createEventIcon = (type, side, isActive) => {
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
  const borderColor = colors[side] || '#1e3a5f';
  const bgColor = isActive ? borderColor : '#fffef5';
  const textColor = isActive ? '#fffef5' : borderColor;
  
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
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        transition: all 0.3s ease;
        cursor: pointer;
      ">
        <span style="color: ${textColor};">${symbols[type] || '●'}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
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
    
    layer.bindTooltip(
      `<div class="colony-tooltip">
        <strong>${props.name}</strong>
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

export default function Map({ 
  events, 
  colonyBoundaries,
  activeEventId, 
  onEventClick,
  showColonies,
  darkMode,
  autoFly = true
}) {
  const activeEvent = events.find(e => e.id === activeEventId);
  const center = activeEvent 
    ? [activeEvent.lat, activeEvent.lng] 
    : [39.5, -76.0];
  const zoom = activeEvent ? 7 : 5;

  const terrainUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}';
  const physicalUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
  const darkTerrainUrl = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png';

  return (
    <div className={`map-container ${darkMode ? 'dark' : 'light'}`}>
      <MapContainer
        center={[39.5, -76.0]}
        zoom={5}
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
          <ColonyBoundaries boundaries={colonyBoundaries} darkMode={darkMode} />
        )}
        
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.lat, event.lng]}
            icon={createEventIcon(event.type, event.side, event.id === activeEventId)}
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
