import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../lib/utils';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pulsing marker icon
const createPulsingIcon = (color) => {
    return L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
      <div style="
        width: 12px;
        height: 12px;
        background-color: ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          inset: -4px;
          border: 2px solid ${color};
          border-radius: 50%;
          animation: map-pulse 1.5s infinite;
        "></div>
      </div>
    `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
    });
};

const MapView = ({ center = [41.8781, -87.6298], zoom = 12, markers = [], className }) => {
    return (
        <div className={cn("relative w-full h-full rounded-xl overflow-hidden glass border-[var(--border)]", className)}>
            <MapContainer
                center={center}
                zoom={zoom}
                scrollWheelZoom={false}
                zoomControl={false}
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {markers.map((marker, idx) => (
                    <Marker
                        key={idx}
                        position={marker.position}
                        icon={createPulsingIcon(marker.color || 'var(--accent-cyan)')}
                    >
                        {marker.popup && (
                            <Popup>
                                <div className="p-2 min-w-[120px]">
                                    <p className="text-xs font-bold mb-1">{marker.popup.title}</p>
                                    <p className="text-[10px] text-gray-500">{marker.popup.description}</p>
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}

                <ZoomControl position="bottomright" />
            </MapContainer>

            {/* Map Overlay Styles */}
            <style>{`
        @keyframes map-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .leaflet-container {
          background: var(--bg-base) !important;
        }
        .leaflet-popup-content-wrapper {
          background: var(--bg-elevated) !important;
          color: white !important;
          border: 1px solid var(--border) !important;
          border-radius: 8px !important;
        }
        .leaflet-popup-tip {
          background: var(--bg-elevated) !important;
        }
      `}</style>
        </div>
    );
};

export default MapView;
