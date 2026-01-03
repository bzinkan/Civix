'use client';

import { useState } from 'react';
import PropertyCardItem from './PropertyCardItem';
import dynamic from 'next/dynamic';
import HelpTooltip from './HelpTooltip';
import { useHelp } from '../contexts/HelpContext';

// Dynamically import map modal to avoid SSR issues
const MapModal = dynamic(
  () => import('./ZoningMap').then((mod) => mod.MapModal),
  { ssr: false }
);

export interface PropertyData {
  address: string;
  city?: string;
  state?: string;
  county?: string;
  cityId?: string;
  parcelId?: string;
  zone?: string;
  zoneName?: string;
  zoneType?: string; // residential, commercial, downtown, industrial, public, parks
  zoneSource?: 'jurisdiction' | 'county' | 'default'; // Where zone data came from
  coordinates?: { lat: number; lon: number } | null;
  lotSize?: number;
  yearBuilt?: number;
  isVacant?: boolean;
  // Overlays and flags
  overlays?: string[];
  constraints?: string[];
  floodplain?: string | null; // e.g., "Zone AE", "Zone X"
  historicDistrict?: string | null;
  outsideCityLimits?: boolean;
  // Civic info
  councilDistrict?: string;
  councilRep?: string;
  schoolDistrict?: string;
  trashDay?: string;
  recyclingDay?: string;
  // Zone-specific
  parkingRatio?: string;
  far?: number;
  maxHeight?: number;
  loadingRequired?: boolean;
  currentUse?: string;
  managedBy?: string;
  buildableArea?: number;
  lastSalePrice?: number;
  lastSaleDate?: string;
  allowedUses?: {
    permitted?: string[];
    conditional?: string[];
    prohibited?: string[];
  };
}

interface PropertyCardProps {
  property: PropertyData;
  onSave?: () => void;
  onClose?: () => void;
  isSaved?: boolean;
  showCloseButton?: boolean;
  addressLabel?: string; // A, B, C label for multi-address mode
}

function classifyZone(zone?: string): string {
  if (!zone) return 'commercial';
  if (/^SF|^RM-|^RMX/i.test(zone)) return 'residential';
  if (/^CN|^CC/i.test(zone)) return 'commercial';
  if (/^DD/i.test(zone)) return 'downtown';
  if (/^MG|^ML/i.test(zone)) return 'industrial';
  if (/^OL/i.test(zone)) return 'office';
  if (/^PF/i.test(zone)) return 'public';
  if (/^PR/i.test(zone)) return 'parks';
  return 'commercial';
}

export default function PropertyCard({ property, onSave, onClose, isSaved = false, showCloseButton = true, addressLabel }: PropertyCardProps) {
  const [showMapModal, setShowMapModal] = useState(false);
  const zoneType = property.zoneType || classifyZone(property.zone);
  const { showHelpIcons, hideHelpIcons } = useHelp();

  const hasCoordinates = property.coordinates?.lat && property.coordinates?.lon;

  // Check for special conditions to display as flags
  const hasFloodplain = property.floodplain && property.floodplain !== 'Zone X';
  const hasHistoric = !!property.historicDistrict;
  const hasOverlays = property.overlays && property.overlays.length > 0;
  const isOutsideCityLimits = property.outsideCityLimits || property.zoneSource === 'county';

  // Zone icons by type
  const zoneIcons: Record<string, string> = {
    residential: 'house',
    commercial: 'building',
    downtown: 'city',
    industrial: 'factory',
    public: 'landmark',
    parks: 'tree',
    office: 'briefcase',
  };

  // Check if trash service applies (residential zones, not commercial/industrial)
  const hasTrashService = zoneType === 'residential' && property.trashDay;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {addressLabel && (
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                {addressLabel}
              </span>
            )}
            <h3 className="font-semibold text-gray-800">{property.address}</h3>
          </div>
          <p className="text-sm text-gray-500">
            {property.city}{property.state ? `, ${property.state}` : ''}
            {property.county ? ` (${property.county} County)` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSave && (
            <button
              onClick={onSave}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                isSaved
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
              title="Clear address"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* CORE INFO: Zone + Parcel */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <PropertyCardItem
          icon={zoneIcons[zoneType] || 'building'}
          label="Zoning"
          value={property.zone || 'Unknown'}
          subtext={property.zoneName}
        />
        <PropertyCardItem
          icon="hash"
          label="Parcel"
          value={property.parcelId || 'Not identified'}
        />
      </div>

      {/* CONDITIONAL FLAGS - Only show if applicable */}
      {(hasFloodplain || hasHistoric || isOutsideCityLimits || hasOverlays) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {hasFloodplain && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16" />
              </svg>
              Floodplain: {property.floodplain}
            </span>
          )}
          {hasHistoric && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Historic: {property.historicDistrict}
            </span>
          )}
          {isOutsideCityLimits && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Outside City Limits
            </span>
          )}
          {hasOverlays && property.overlays?.map((overlay, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              {overlay}
            </span>
          ))}
        </div>
      )}

      {/* CIVIC INFO */}
      <div className="grid grid-cols-3 gap-3">
        {/* Trash - only for residential */}
        {hasTrashService && (
          <PropertyCardItem
            icon="trash"
            label="Trash Day"
            value={property.trashDay!}
          />
        )}
        {/* Council District */}
        <PropertyCardItem
          icon="landmark"
          label="Council"
          value={property.councilDistrict || 'Unknown'}
          subtext={property.councilRep}
        />
        {/* School District */}
        <PropertyCardItem
          icon="school"
          label="School District"
          value={property.schoolDistrict || 'Check county'}
        />
      </div>

      {/* Map Section - just a button to open full modal */}
      {hasCoordinates && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMapModal(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              View zoning map
            </button>
            <HelpTooltip
              text="Opens an interactive map showing zoning boundaries around this property. Click on different zones to see their codes and descriptions."
              showIcons={showHelpIcons}
              onHideIcons={hideHelpIcons}
              position="right"
            />
          </div>
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && hasCoordinates && (
        <MapModal
          lat={property.coordinates!.lat}
          lon={property.coordinates!.lon}
          currentZone={property.zone}
          onClose={() => setShowMapModal(false)}
        />
      )}
    </div>
  );
}
