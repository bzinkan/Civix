'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Types for zoning polygon data
interface ZoningPolygon {
  id: string;
  zoneCode: string;
  zoneDescription: string | null;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

interface ZoningMapProps {
  lat: number;
  lon: number;
  currentZone?: string;
  expanded?: boolean;
  onClose?: () => void;
  onToggleExpand?: () => void;
}

// Zone colors based on type
const getZoneColor = (zoneCode: string): string => {
  if (/^SF|^R-/i.test(zoneCode)) return '#93c47d'; // Residential - green
  if (/^RM/i.test(zoneCode)) return '#a4c2f4'; // Multi-family - light blue
  if (/^CN|^CC|^C-/i.test(zoneCode)) return '#f6b26b'; // Commercial - orange
  if (/^DD/i.test(zoneCode)) return '#c27ba0'; // Downtown - purple
  if (/^MG|^ML|^M-|^I-/i.test(zoneCode)) return '#999999'; // Industrial - gray
  if (/^OL|^O-/i.test(zoneCode)) return '#8e7cc3'; // Office - purple
  if (/^PF/i.test(zoneCode)) return '#6fa8dc'; // Public - blue
  if (/^PR/i.test(zoneCode)) return '#6aa84f'; // Parks - dark green
  return '#d9d9d9'; // Unknown - light gray
};

// Check if zone is a large overlay type (parks, open space) that should render behind
const isBackgroundZone = (zoneCode: string): boolean => {
  return /^PR|^OS|^PARK|^GREEN/i.test(zoneCode);
};

// Calculate approximate polygon area for sorting (larger areas render first/behind)
const getPolygonArea = (geometry: ZoningPolygon['geometry']): number => {
  try {
    let coords: number[][];
    if (geometry.type === 'Polygon') {
      coords = geometry.coordinates[0] as number[][];
    } else if (geometry.type === 'MultiPolygon') {
      coords = (geometry.coordinates[0] as number[][][])[0];
    } else {
      return 0;
    }

    // Simple shoelace formula for approximate area
    let area = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1];
      area -= coords[i + 1][0] * coords[i][1];
    }
    return Math.abs(area / 2);
  } catch {
    return 0;
  }
};

// Sort polygons: largest/background zones first so they render behind
const sortPolygons = (polygons: ZoningPolygon[]): ZoningPolygon[] => {
  return [...polygons].sort((a, b) => {
    // Background zones always go first (render behind)
    const aIsBackground = isBackgroundZone(a.zoneCode);
    const bIsBackground = isBackgroundZone(b.zoneCode);
    if (aIsBackground && !bIsBackground) return -1;
    if (!aIsBackground && bIsBackground) return 1;

    // Then sort by area (larger first)
    return getPolygonArea(b.geometry) - getPolygonArea(a.geometry);
  });
};

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// Mini map preview component (shows in PropertyCard)
export function MiniMapPreview({ lat, lon, currentZone, onToggleExpand }: ZoningMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [polygons, setPolygons] = useState<ZoningPolygon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch nearby zoning polygons
  useEffect(() => {
    if (!isClient) return;

    const fetchPolygons = async () => {
      try {
        const res = await fetch(`/api/map/zones?lat=${lat}&lon=${lon}&radius=0.005`);
        if (res.ok) {
          const data = await res.json();
          setPolygons(data.polygons || []);
        }
      } catch (error) {
        console.error('Failed to fetch zoning polygons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolygons();
  }, [lat, lon, isClient]);

  if (!isClient) {
    return (
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading map...</span>
      </div>
    );
  }

  return (
    <div
      className="relative h-32 rounded-lg overflow-hidden cursor-pointer group border border-gray-200"
      onClick={onToggleExpand}
    >
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <MapContainer
        center={[lat, lon]}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Render zoning polygons - simple rendering for preview (no sorting) */}
        {polygons.map((polygon) => {
          const positions = convertToLeafletCoords(polygon.geometry);
          const isCurrentZone = polygon.zoneCode === currentZone;

          return (
            <Polygon
              key={polygon.id}
              positions={positions}
              pathOptions={{
                color: isCurrentZone ? '#1d4ed8' : getZoneColor(polygon.zoneCode),
                weight: isCurrentZone ? 3 : 1,
                fillColor: getZoneColor(polygon.zoneCode),
                fillOpacity: isCurrentZone ? 0.35 : 0.2,
              }}
            />
          );
        })}
      </MapContainer>

      {/* Expand overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-3 py-1.5 rounded-full text-sm font-medium text-gray-700 shadow">
          Expand for details
        </div>
      </div>

      {/* Zone label */}
      <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-medium text-gray-700 shadow">
        {currentZone || 'Zone'}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Loading zones...</span>
        </div>
      )}
    </div>
  );
}

// Full expanded map modal
export function MapModal({ lat, lon, currentZone, onClose }: ZoningMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [polygons, setPolygons] = useState<ZoningPolygon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<ZoningPolygon | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch nearby zoning polygons with larger radius
  useEffect(() => {
    if (!isClient) return;

    const fetchPolygons = async () => {
      try {
        const res = await fetch(`/api/map/zones?lat=${lat}&lon=${lon}&radius=0.02`);
        if (res.ok) {
          const data = await res.json();
          setPolygons(data.polygons || []);
        }
      } catch (error) {
        console.error('Failed to fetch zoning polygons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPolygons();
  }, [lat, lon, isClient]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isClient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="font-semibold text-gray-800">Zoning Map</h2>
            <p className="text-sm text-gray-500">
              Current zone: <span className="font-medium">{currentZone}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />

          <MapContainer
            center={[lat, lon]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Render zoning polygons - sorted so large/background zones render first */}
            {sortPolygons(polygons).map((polygon) => {
              const positions = convertToLeafletCoords(polygon.geometry);
              const isCurrentZone = polygon.zoneCode === currentZone;
              const isSelected = selectedZone?.id === polygon.id;
              const isBackground = isBackgroundZone(polygon.zoneCode);

              return (
                <Polygon
                  key={polygon.id}
                  positions={positions}
                  pathOptions={{
                    color: isSelected ? '#dc2626' : isCurrentZone ? '#1d4ed8' : getZoneColor(polygon.zoneCode),
                    weight: isSelected ? 3 : isCurrentZone ? 2 : 1,
                    fillColor: getZoneColor(polygon.zoneCode),
                    fillOpacity: isSelected ? 0.45 : isCurrentZone ? 0.35 : isBackground ? 0.1 : 0.2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedZone(polygon),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">{polygon.zoneCode}</div>
                      {polygon.zoneDescription && (
                        <div className="text-gray-600">{polygon.zoneDescription}</div>
                      )}
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Property marker */}
            <PropertyMarker lat={lat} lon={lon} />
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[1000]">
              <div className="text-gray-600">Loading zoning data...</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex flex-wrap gap-3 text-xs">
            <LegendItem color="#93c47d" label="Residential" />
            <LegendItem color="#a4c2f4" label="Multi-Family" />
            <LegendItem color="#f6b26b" label="Commercial" />
            <LegendItem color="#c27ba0" label="Downtown" />
            <LegendItem color="#999999" label="Industrial" />
            <LegendItem color="#6aa84f" label="Parks" />
          </div>
        </div>

        {/* Selected zone info */}
        {selectedZone && (
          <div className="px-4 py-3 border-t bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-800">{selectedZone.zoneCode}</span>
                {selectedZone.zoneDescription && (
                  <span className="text-blue-600 ml-2">{selectedZone.zoneDescription}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Property marker component with custom icon
function PropertyMarker({ lat, lon }: { lat: number; lon: number }) {
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet dynamically for the icon
    import('leaflet').then((L) => {
      setIcon(
        L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 24px;
            height: 24px;
            background: #1d4ed8;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      );
    });
  }, []);

  if (!icon) return null;

  return <Marker position={[lat, lon]} icon={icon} />;
}

// Legend item component
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-3 rounded-sm border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}

// Convert GeoJSON coordinates to Leaflet format
function convertToLeafletCoords(geometry: ZoningPolygon['geometry']): [number, number][][] {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring =>
      (ring as number[][]).map(coord => [coord[1], coord[0]] as [number, number])
    );
  } else if (geometry.type === 'MultiPolygon') {
    // For MultiPolygon, flatten to array of rings
    const rings: [number, number][][] = [];
    for (const polygon of geometry.coordinates as number[][][][]) {
      for (const ring of polygon) {
        rings.push(ring.map(coord => [coord[1], coord[0]] as [number, number]));
      }
    }
    return rings;
  }
  return [];
}

export default MiniMapPreview;
