'use client';

import { useState, useEffect } from 'react';

interface ParcelData {
  parcelId: string;
  address?: string;
  owner?: string;
  ownerAddress?: string;
  lotSize?: number; // in sq ft
  lotSizeAcres?: number;
  yearBuilt?: number;
  buildingArea?: number; // in sq ft
  assessedValue?: number;
  marketValue?: number;
  landValue?: number;
  improvementValue?: number;
  taxYear?: number;
  propertyClass?: string;
  subdivision?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
  deedBook?: string;
  deedPage?: string;
  source?: string;
  sourceUrl?: string;
}

interface ParcelInfoModalProps {
  parcelId: string;
  address: string;
  county?: string;
  state?: string;
  onClose: () => void;
}

export default function ParcelInfoModal({ parcelId, address, county, state, onClose }: ParcelInfoModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);

  useEffect(() => {
    async function fetchParcelData() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          parcelId,
          address,
          ...(county && { county }),
          ...(state && { state }),
        });

        const response = await fetch(`/api/parcel-data?${params}`);
        const data = await response.json();

        if (data.success && data.parcel) {
          setParcelData(data.parcel);
        } else {
          setError(data.error || 'Could not retrieve parcel data');
        }
      } catch {
        setError('Failed to fetch parcel data');
      } finally {
        setLoading(false);
      }
    }

    fetchParcelData();
  }, [parcelId, address, county, state]);

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Parcel Details</h2>
            <p className="text-sm text-gray-500">{address}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Loading parcel data...</span>
            </div>
          )}

          {error && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-amber-800 font-medium">Parcel Data Unavailable</p>
                  <p className="text-amber-700 text-sm mt-1">{error}</p>
                  <p className="text-amber-600 text-sm mt-2">
                    Try searching the county auditor website directly for parcel ID: <span className="font-mono">{parcelId}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {parcelData && !loading && (
            <div className="space-y-6">
              {/* Basic Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Property Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Parcel ID</label>
                    <p className="text-sm font-medium text-gray-800 font-mono">{parcelData.parcelId}</p>
                  </div>
                  {parcelData.propertyClass && (
                    <div>
                      <label className="text-xs text-gray-500">Property Class</label>
                      <p className="text-sm font-medium text-gray-800">{parcelData.propertyClass}</p>
                    </div>
                  )}
                  {parcelData.yearBuilt && (
                    <div>
                      <label className="text-xs text-gray-500">Year Built</label>
                      <p className="text-sm font-medium text-gray-800">{parcelData.yearBuilt}</p>
                    </div>
                  )}
                  {parcelData.buildingArea && (
                    <div>
                      <label className="text-xs text-gray-500">Building Size</label>
                      <p className="text-sm font-medium text-gray-800">{formatNumber(parcelData.buildingArea)} sq ft</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500">Lot Size</label>
                    <p className="text-sm font-medium text-gray-800">
                      {parcelData.lotSizeAcres
                        ? `${parcelData.lotSizeAcres.toFixed(2)} acres`
                        : parcelData.lotSize
                          ? `${formatNumber(parcelData.lotSize)} sq ft`
                          : 'N/A'}
                    </p>
                  </div>
                  {parcelData.subdivision && (
                    <div>
                      <label className="text-xs text-gray-500">Subdivision</label>
                      <p className="text-sm font-medium text-gray-800">{parcelData.subdivision}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Owner Info */}
              {parcelData.owner && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Ownership</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-800">{parcelData.owner}</p>
                    {parcelData.ownerAddress && (
                      <p className="text-sm text-gray-600 mt-1">{parcelData.ownerAddress}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Values */}
              {(parcelData.assessedValue || parcelData.marketValue) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Assessed Values {parcelData.taxYear && `(${parcelData.taxYear})`}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {parcelData.marketValue && (
                      <div>
                        <label className="text-xs text-gray-500">Market Value</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(parcelData.marketValue)}</p>
                      </div>
                    )}
                    {parcelData.assessedValue && (
                      <div>
                        <label className="text-xs text-gray-500">Assessed Value</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(parcelData.assessedValue)}</p>
                      </div>
                    )}
                    {parcelData.landValue && (
                      <div>
                        <label className="text-xs text-gray-500">Land Value</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(parcelData.landValue)}</p>
                      </div>
                    )}
                    {parcelData.improvementValue && (
                      <div>
                        <label className="text-xs text-gray-500">Improvement Value</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(parcelData.improvementValue)}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Sale History */}
              {(parcelData.lastSaleDate || parcelData.lastSalePrice) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Last Sale</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {parcelData.lastSaleDate && (
                      <div>
                        <label className="text-xs text-gray-500">Sale Date</label>
                        <p className="text-sm font-medium text-gray-800">{formatDate(parcelData.lastSaleDate)}</p>
                      </div>
                    )}
                    {parcelData.lastSalePrice && (
                      <div>
                        <label className="text-xs text-gray-500">Sale Price</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(parcelData.lastSalePrice)}</p>
                      </div>
                    )}
                    {parcelData.deedBook && parcelData.deedPage && (
                      <div>
                        <label className="text-xs text-gray-500">Deed Reference</label>
                        <p className="text-sm font-medium text-gray-800">Book {parcelData.deedBook}, Page {parcelData.deedPage}</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Source */}
              {parcelData.source && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Data from: {parcelData.source}
                    {parcelData.sourceUrl && (
                      <>
                        {' · '}
                        <a
                          href={parcelData.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View on county site
                        </a>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
