import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';

// Category color mapping
const CATEGORY_COLORS = {
    pothole: '#EF4444',     // red
    streetlight: '#F59E0B', // yellow
    garbage: '#10B981',     // green
    flooding: '#3B82F6',    // blue
    water: '#06B6D4',       // cyan
    air: '#9CA3AF',         // gray
    default: '#00D4FF'      // bright cyan
};

function getAqiColor(val) {
    if (val <= 50) return '#22C55E';
    if (val <= 100) return '#EAB308';
    if (val <= 200) return '#F97316';
    if (val <= 300) return '#EF4444';
    return '#7C3AED';
}

// Controller to handle programmatic map movements
function MapController({ center, zoom, markers }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom || 14);
        }
    }, [center, zoom, map]);

    useEffect(() => {
        if (markers && markers.length > 0) {
            const m = markers[0];
            if (m.lat && m.lon) {
                map.flyTo([m.lat, m.lon], 14, { duration: 1.5 });
            }
        }
    }, [markers, map]);

    return null;
}

export default function IndiaMap({
    markers = [],
    showAQI = false,
    showUserLocation = true,
    height = '500px',
    onMarkerClick,
    city = 'Mumbai'
}) {
    const [userCenter, setUserCenter] = useState(null);
    const [mapZoom, setMapZoom] = useState(12);
    const [notification, setNotification] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCenter, setSearchCenter] = useState(null);
    const [activeToggle, setActiveToggle] = useState('Civic Issues');

    // Simulated AQI data for visible bounds demonstration
    const [aqiData, setAqiData] = useState([]);

    // Determine actual display height based on screen size (simplified responsive logic)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const displayHeight = isMobile ? '300px' : height;

    const geocodeCity = useCallback(async (cityName) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&country=India&format=json`);
            const data = await res.json();
            if (data && data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (err) {
            console.error('Geocoding error:', err);
        }
        return [19.0760, 72.8777]; // Mumbai fallback
    }, []);

    useEffect(() => {
        const locateUser = async () => {
            if (showUserLocation && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setUserCenter([pos.coords.latitude, pos.coords.longitude]);
                        setMapZoom(14);
                    },
                    async (err) => {
                        console.warn('Geolocation denied or failed. Fallback to city.');
                        setNotification(`Location access denied. Showing ${city}.`);
                        const fallbackCoords = await geocodeCity(city);
                        setUserCenter(fallbackCoords);
                        setMapZoom(12);
                        setTimeout(() => setNotification(''), 4000);
                    },
                    { timeout: 10000 }
                );
            } else {
                const fallbackCoords = await geocodeCity(city);
                setUserCenter(fallbackCoords);
            }
        };
        locateUser();
    }, [showUserLocation, city, geocodeCity]);

    // Simulate fetching AQI data when in AQI mode
    useEffect(() => {
        if (activeToggle === 'AQI' && userCenter) {
            // Mocking AQI stations around the user center
            const mockAqi = [
                { id: 1, lat: userCenter[0] + 0.01, lon: userCenter[1] + 0.01, name: 'Station A', aqi: 45 },
                { id: 2, lat: userCenter[0] - 0.02, lon: userCenter[1] + 0.015, name: 'Station B', aqi: 120 },
                { id: 3, lat: userCenter[0] + 0.015, lon: userCenter[1] - 0.02, name: 'Station C', aqi: 250 },
            ];
            setAqiData(mockAqi);
        }
    }, [activeToggle, userCenter]);

    const handleSearch = async (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            const coords = await geocodeCity(searchQuery);
            setSearchCenter(coords);
            setSearchQuery('');
        }
    };

    const centerToUse = searchCenter || userCenter || [20.5937, 78.9629]; // Default India

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0f1d]" style={{ height: displayHeight }}>

            {/* Toast Notification */}
            {notification && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-gray-900 border border-cyan-500/50 text-cyan-50 px-4 py-2 rounded-full text-sm shadow-lg animate-fade-in-down">
                    {notification}
                </div>
            )}

            {/* LIVE Badge */}
            <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-wider">LIVE {markers.length} Active Issues</span>
            </div>

            {/* Search Input */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-64 md:w-80">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Search city..."
                    className="w-full bg-black/60 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-lg placeholder-gray-400"
                />
            </div>

            {/* Controls Panel (Glassmorphism) */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2 rounded-xl shadow-lg w-32 md:w-auto">
                {['Civic Issues', 'AQI', 'Flood Zones', 'Ward Limits'].map((toggle) => (
                    <button
                        key={toggle}
                        onClick={() => setActiveToggle(toggle)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-left md:text-center ${activeToggle === toggle
                                ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                : 'border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10'
                            }`}
                    >
                        {toggle}
                    </button>
                ))}
            </div>

            {/* Map Container */}
            {userCenter && (
                <MapContainer
                    center={centerToUse}
                    zoom={mapZoom}
                    minZoom={5}
                    maxZoom={18}
                    style={{ height: '100%', width: '100%', background: '#0a0f1d' }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />

                    <MapController center={searchCenter} markers={markers} zoom={12} />

                    {/* User Location Pin */}
                    {userCenter && activeToggle === 'Civic Issues' && (
                        <CircleMarker
                            center={userCenter}
                            radius={8}
                            pathOptions={{
                                fillColor: '#22d3ee', // cyan-400
                                color: '#fff',
                                weight: 2,
                                fillOpacity: 1,
                                className: 'animate-pulse'
                            }}
                        >
                            <Popup className="custom-popup">
                                <div className="font-semibold text-gray-800">You are here</div>
                            </Popup>
                        </CircleMarker>
                    )}

                    {/* Markers Clustering & Civic Issues rendering */}
                    {(activeToggle === 'Civic Issues' || activeToggle === 'Ward Limits') && (
                        <MarkerClusterGroup
                            chunkedLoading
                            maxClusterRadius={40}
                            showCoverageOnHover={false}
                            spiderfyOnMaxZoom={true}
                        >
                            {markers.map((marker, i) => (
                                <CircleMarker
                                    key={marker.id || i}
                                    center={[marker.lat, marker.lon]}
                                    radius={8}
                                    pathOptions={{
                                        fillColor: CATEGORY_COLORS[marker.category?.toLowerCase()] || CATEGORY_COLORS.default,
                                        color: '#fff',
                                        weight: 2,
                                        fillOpacity: 0.8
                                    }}
                                    eventHandlers={{
                                        click: () => onMarkerClick && onMarkerClick(marker)
                                    }}
                                >
                                    <Popup className="custom-popup">
                                        <div className="p-1 min-w-[150px]">
                                            <div className="font-bold text-gray-800 mb-1">{marker.title}</div>
                                            <div className="flex gap-2 items-center mb-2">
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                    {marker.category || 'General'}
                                                </span>
                                                {marker.priority && (
                                                    <span className={`w-2 h-2 rounded-full ${marker.priority === 'High' ? 'bg-red-500' :
                                                            marker.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}></span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">Reported: {marker.date || 'Recently'}</div>
                                            <a href={`/issue/${marker.id}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                                                View Details →
                                            </a>
                                        </div>
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MarkerClusterGroup>
                    )}

                    {/* AQI Overlay rendering */}
                    {(activeToggle === 'AQI' || showAQI) && aqiData.map(st => (
                        <Circle
                            key={st.id}
                            center={[st.lat, st.lon]}
                            radius={500}
                            pathOptions={{
                                fillColor: getAqiColor(st.aqi),
                                color: getAqiColor(st.aqi),
                                weight: 1,
                                fillOpacity: 0.25
                            }}
                        >
                            <Tooltip sticky>
                                <strong>{st.name}</strong> <br /> AQI: {st.aqi}
                            </Tooltip>
                        </Circle>
                    ))}

                </MapContainer>
            )}

            {/* Locate Me Button */}
            <button
                onClick={() => {
                    if (userCenter) setSearchCenter([...userCenter]);
                }}
                className="absolute bottom-4 right-4 z-[1000] w-12 h-12 bg-gray-900 border border-cyan-500 hover:bg-gray-800 rounded-full flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors shadow-[0_0_15px_rgba(34,211,238,0.3)] group"
            >
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>

            {/* Global override for Leaflet popup default styles (to match theme) */}
            <style>{`
        .leaflet-popup-content-wrapper {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .leaflet-popup-tip {
          background-color: #ffffff;
        }
      `}</style>
        </div>
    );
}
