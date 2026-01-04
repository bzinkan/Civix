'use client';

import { useState } from 'react';
import PropertyCardItem from './PropertyCardItem';
import dynamic from 'next/dynamic';
import HelpTooltip from './HelpTooltip';
import { useHelp } from '../contexts/HelpContext';
import ParcelInfoModal from './ParcelInfoModal';

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
  // HOA detection
  mayHaveHOA?: boolean;
  hoaIndicators?: string[]; // Reasons why we think there may be an HOA
  // Utilities
  utilities?: {
    sewer?: 'municipal' | 'septic' | 'unknown';
    sewerProvider?: string;
    water?: 'municipal' | 'well' | 'unknown';
    waterProvider?: string;
    gas?: 'available' | 'not_available' | 'unknown';
    gasProvider?: string;
    electric?: string; // Provider name
    internet?: string[]; // Available providers
  };
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
  const [showParcelInfo, setShowParcelInfo] = useState(false);
  const zoneType = property.zoneType || classifyZone(property.zone);
  const { showHelpIcons, hideHelpIcons } = useHelp();

  const hasCoordinates = property.coordinates?.lat && property.coordinates?.lon;

  // Check for special conditions to display as flags
  const hasFloodplain = property.floodplain && property.floodplain !== 'Zone X';
  const hasHistoric = !!property.historicDistrict;
  const hasOverlays = property.overlays && property.overlays.length > 0;
  const isOutsideCityLimits = property.outsideCityLimits || property.zoneSource === 'county';
  const mayHaveHOA = property.mayHaveHOA;
  const noPropertyDataFound = property.zoneSource === 'default';

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
          {/* Parcel Info Button */}
          {property.parcelId && (
            <button
              onClick={() => setShowParcelInfo(true)}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="View parcel details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
      {(hasFloodplain || hasHistoric || isOutsideCityLimits || hasOverlays || mayHaveHOA || noPropertyDataFound) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {noPropertyDataFound && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full cursor-help"
              title="No property record found at this address. This may be an empty lot, incorrect address, or new construction not yet in records."
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No Property Record Found
            </span>
          )}
          {mayHaveHOA && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full cursor-help"
              title={property.hoaIndicators?.join(', ') || 'Based on property characteristics'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              May Have HOA
            </span>
          )}
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

      {/* UTILITIES - Show if available */}
      {property.utilities && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Utilities</h4>
          <div className="space-y-2 text-sm">
            {/* Water */}
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16" />
              </svg>
              <div>
                <span className="text-gray-700 font-medium">Water: </span>
                <span className="text-gray-600">
                  {property.utilities.water === 'municipal' ? 'Municipal' : property.utilities.water === 'well' ? 'Private Well' : 'Unknown'}
                </span>
                {property.utilities.waterProvider && (
                  <span className="text-gray-500 text-xs block">{property.utilities.waterProvider}</span>
                )}
              </div>
            </div>
            {/* Sewer */}
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <div>
                <span className="text-gray-700 font-medium">Sewer: </span>
                <span className="text-gray-600">
                  {property.utilities.sewer === 'municipal' ? 'Municipal' : property.utilities.sewer === 'septic' ? 'Private Septic' : 'Unknown'}
                </span>
                {property.utilities.sewerProvider && (
                  <span className="text-gray-500 text-xs block">{property.utilities.sewerProvider}</span>
                )}
              </div>
            </div>
            {/* Gas */}
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <div>
                <span className="text-gray-700 font-medium">Natural Gas: </span>
                <span className="text-gray-600">
                  {property.utilities.gas === 'available' ? 'Available' : property.utilities.gas === 'not_available' ? 'Not Available' : 'Unknown'}
                </span>
                {property.utilities.gasProvider && property.utilities.gas === 'available' && (
                  <span className="text-gray-500 text-xs block">{property.utilities.gasProvider}</span>
                )}
              </div>
            </div>
            {/* Electric */}
            {property.utilities.electric && (
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <span className="text-gray-700 font-medium">Electric: </span>
                  <span className="text-gray-600">{property.utilities.electric}</span>
                </div>
              </div>
            )}
            {/* Internet */}
            {property.utilities.internet && property.utilities.internet.length > 0 && (
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <div>
                  <span className="text-gray-700 font-medium">Internet: </span>
                  <span className="text-gray-600">{property.utilities.internet.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Parcel Info Modal */}
      {showParcelInfo && property.parcelId && (
        <ParcelInfoModal
          parcelId={property.parcelId}
          address={property.address}
          county={property.county}
          state={property.state}
          onClose={() => setShowParcelInfo(false)}
        />
      )}
    </div>
  );
}
