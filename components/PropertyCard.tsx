'use client';

import { useState } from 'react';
import PropertyCardItem from './PropertyCardItem';

export interface PropertyData {
  address: string;
  city?: string;
  cityId?: string;
  parcelId?: string;
  zone?: string;
  zoneName?: string;
  zoneType?: string; // residential, commercial, downtown, industrial, public, parks
  lotSize?: number;
  yearBuilt?: number;
  isVacant?: boolean;
  overlays?: string[];
  constraints?: string[];
  councilDistrict?: string;
  councilRep?: string;
  trashDay?: string;
  recyclingDay?: string;
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

export default function PropertyCard({ property, onSave, onClose, isSaved = false, showCloseButton = true }: PropertyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const zoneType = property.zoneType || classifyZone(property.zone);

  // Determine which 7 items to show based on zone type
  const getItems = () => {
    const items: Array<{ icon: string; label: string; value: string; subtext?: string }> = [];

    // First item is always Zone
    const zoneIcons: Record<string, string> = {
      residential: 'house',
      commercial: 'building',
      downtown: 'city',
      industrial: 'factory',
      public: 'landmark',
      parks: 'tree',
      office: 'briefcase',
    };

    items.push({
      icon: zoneIcons[zoneType] || 'building',
      label: 'Zone',
      value: property.zone || 'Unknown',
      subtext: property.zoneName,
    });

    // Second item varies by zone type
    switch (zoneType) {
      case 'residential':
        items.push({
          icon: 'trash',
          label: 'Trash Day',
          value: property.trashDay || 'Check online',
        });
        break;
      case 'commercial':
        items.push({
          icon: 'car',
          label: 'Parking Req',
          value: property.parkingRatio || 'Per code',
        });
        break;
      case 'downtown':
        items.push({
          icon: 'chart',
          label: 'FAR',
          value: property.far ? property.far.toString() : 'Check code',
        });
        break;
      case 'industrial':
        items.push({
          icon: 'truck',
          label: 'Loading Req',
          value: property.loadingRequired ? 'Required' : 'Check code',
        });
        break;
      case 'public':
      case 'parks':
        items.push({
          icon: 'target',
          label: 'Current Use',
          value: property.currentUse || 'Public facility',
        });
        break;
      default:
        items.push({
          icon: 'info',
          label: 'Type',
          value: zoneType.charAt(0).toUpperCase() + zoneType.slice(1),
        });
    }

    // Council District (always shown)
    items.push({
      icon: 'landmark',
      label: 'Council',
      value: property.councilDistrict || 'Unknown',
      subtext: property.councilRep,
    });

    // Lot Size / Acreage
    items.push({
      icon: 'ruler',
      label: zoneType === 'parks' ? 'Acreage' : 'Lot Size',
      value: property.lotSize ? `${property.lotSize.toLocaleString()} sq ft` : 'Unknown',
    });

    // Allowed Use
    const useLabel = zoneType === 'parks' ? 'Allowed Use' : 'Allowed Use';
    const useValue = property.allowedUses?.permitted?.[0] || (zoneType === 'residential' ? 'Single Family' : 'Commercial');
    items.push({
      icon: 'check',
      label: useLabel,
      value: useValue,
    });

    // Constraints
    const constraintsList = property.constraints || property.overlays || [];
    items.push({
      icon: 'alert',
      label: 'Constraints',
      value: constraintsList.length > 0 ? constraintsList.join(', ') : 'None',
    });

    // Year Built / Last Sale (for vacant)
    if (property.isVacant) {
      items.push({
        icon: 'dollar',
        label: 'Last Sale',
        value: property.lastSalePrice ? `$${property.lastSalePrice.toLocaleString()}` : 'Unknown',
        subtext: property.lastSaleDate,
      });
    } else {
      items.push({
        icon: 'calendar',
        label: 'Year Built',
        value: property.yearBuilt ? property.yearBuilt.toString() : 'Unknown',
      });
    }

    return items;
  };

  const items = getItems();
  const topRow = items.slice(0, 4);
  const bottomRow = items.slice(4, 7);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">{property.address}</h3>
          {property.city && (
            <p className="text-sm text-gray-500">{property.city}</p>
          )}
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

      {/* Top Row - 4 items */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {topRow.map((item, index) => (
          <PropertyCardItem key={index} {...item} />
        ))}
      </div>

      {/* Bottom Row - 3 items */}
      <div className="grid grid-cols-3 gap-3">
        {bottomRow.map((item, index) => (
          <PropertyCardItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}
