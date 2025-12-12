'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ChessLocation, EntityType } from '@/types/chess-map'; // Ensure this path is correct
import { Trophy, Castle, GraduationCap, Store, Mic, Crown } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface MapaEscacsClientProps {
    locations: ChessLocation[];
    filteredLocations: ChessLocation[];
    onRegionSelect?: (region: string, type: 'comarca' | 'provincia') => void;
}

// Fix for default Leaflet markers in Next.js/React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to create custom icons
const getIcon = (type: EntityType) => {
    let IconComponent = Castle;
    let color = '#1e3a8a'; // blue-900

    switch (type) {
        case 'Club': IconComponent = Castle; color = '#1e3a8a'; break;
        case 'Tournament': IconComponent = Trophy; color = '#eab308'; break; // yellow-500
        case 'School': IconComponent = GraduationCap; color = '#16a34a'; break; // green-600
        case 'Business': IconComponent = Store; color = '#b91c1c'; break; // red-700
        case 'Conference': IconComponent = Mic; color = '#9ca3af'; break; // gray-400
        case 'Official_Act': IconComponent = Crown; color = '#7e22ce'; break; // purple-700
    }

    const svgString = renderToStaticMarkup(
        <div style={{
            backgroundColor: color,
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
            <IconComponent color="white" size={16} />
        </div>
    );

    return L.divIcon({
        html: svgString,
        className: '', // Remove default class to avoid conflicts
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15],
    });
};

// Component to handle map bounds updates
function MapUpdater({ locations }: { locations: ChessLocation[] }) {
    const map = useMap();

    useEffect(() => {
        if (locations.length === 0) return;

        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude]));
        if (bounds.isValid()) {
            // Check if bounds are wildly large (e.g. world level), if so, stick to Catalonia defaults
            const cataloniaBounds = L.latLngBounds([[40.5, 0.15], [42.9, 3.32]]);
            if (cataloniaBounds.contains(bounds)) {
                map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            } else {
                // For now, always default to Catalonia center if data is sparse or weird
                map.setView([41.5912, 1.5209], 8);
            }

        }
    }, [locations, map]);

    return null;
}

export default function MapaEscacsClient({ locations, filteredLocations, onRegionSelect }: MapaEscacsClientProps) {
    const [geoData, setGeoData] = useState<any>(null);

    useEffect(() => {
        // Attempt to load GeoJSON
        fetch('/data/catalunya.geojson')
            .then(res => {
                if (!res.ok) throw new Error('GeoJSON not found');
                return res.json();
            })
            .then(data => setGeoData(data))
            .catch(err => console.warn('GeoJSON load failed:', err));
    }, []);

    const onEachFeature = (feature: any, layer: L.Layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#fbbf24', // amber-400 (Highlight Border)
                    fillColor: '#334155', // slate-700 (Highlight Fill)
                    fillOpacity: 1
                });
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 0.5,
                    color: '#64748b', // slate-500 (Reset Border)
                    fillColor: '#1e293b', // slate-800 (Reset Fill)
                    fillOpacity: 1
                });
            },
            click: (e) => {
                const layer = e.target;
                const props = feature.properties;
                // Common keys: 'NOMCOMAR', 'nom_comar', 'NOM_COMAR', 'provincia', etc.
                const comarca = props.NOMCOMAR || props.nom_comar || props.NOM_COMAR || props.comarca;
                const provincia = props.NOMPROV || props.nom_prov || props.NOM_PROV || props.provincia;

                if (comarca && onRegionSelect) {
                    onRegionSelect(comarca, 'comarca');
                    layer._map.fitBounds(layer.getBounds());
                } else if (provincia && onRegionSelect) {
                    onRegionSelect(provincia, 'provincia');
                    layer._map.fitBounds(layer.getBounds());
                }
            }
        });
    };

    const cataloniaBounds = [
        [40.4, 0.0], // South-West
        [43.0, 3.5]  // North-East
    ];

    return (
        <MapContainer
            center={[41.8, 1.5]}
            zoom={8}
            minZoom={7}
            maxBounds={cataloniaBounds as L.LatLngBoundsExpression}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', background: '#020617' }} // slate-950 (Void/Sea)
            className="z-0"
        >
            {/* No TileLayer - Custom Vector Map */}

            {geoData && (
                <GeoJSON
                    data={geoData}
                    style={{
                        color: '#64748b', // slate-500 (Borders)
                        weight: 0.5,
                        fillColor: '#1e293b', // slate-800 (Land)
                        fillOpacity: 1
                    }}
                    onEachFeature={onEachFeature}
                />
            )}

            {filteredLocations.map(loc => (
                <Marker
                    key={loc.id}
                    position={[loc.latitude, loc.longitude]}
                    icon={getIcon(loc.entity_type)}
                >
                    <Popup>
                        <div className="font-sans">
                            <h3 className="font-bold text-lg">{loc.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{loc.address}</p>
                            <div className="mt-2 text-xs">
                                <span className="font-semibold">{loc.entity_type}</span>
                                {loc.municipi_nom && <span> • {loc.municipi_nom}</span>}
                            </div>
                            {loc.url && (
                                <a href={loc.url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-500 hover:underline text-sm">
                                    Més informació
                                </a>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}

            <MapUpdater locations={filteredLocations} />
        </MapContainer>
    );
}
