'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ZoningData {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  zoning?: {
    code: string;
    description: string;
    development_standards?: {
      max_height_ft: number | null;
      max_stories: number | null;
      setbacks: {
        front_ft: number | null;
        side_ft: number | null;
        rear_ft: number | null;
      };
      max_lot_coverage: number | null;
      max_far: number | null;
      min_lot_size_sqft: number | null;
      parking_notes: string | null;
    };
  };
  overlays?: {
    historic_district?: string | null;
    hillside?: boolean;
    urban_design?: string | null;
    landslide_risk?: string;
    is_historic?: boolean;
  };
  permits_required?: string[];
  jurisdiction?: {
    id: string;
    name: string;
    state: string;
  };
}

function LookupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [address, setAddress] = useState(searchParams.get('address') || '');
  const [data, setData] = useState<ZoningData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const addressParam = searchParams.get('address');
    if (addressParam) {
      setAddress(addressParam);
      handleLookup(addressParam);
    }
  }, [searchParams]);

  const handleLookup = async (lookupAddress: string) => {
    if (!lookupAddress.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/zoning/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: lookupAddress })
      });

      if (!response.ok) {
        throw new Error('Lookup failed');
      }

      const result = await response.json();
      setData(result);

      // Update URL
      router.replace(`/lookup?address=${encodeURIComponent(lookupAddress)}`);
    } catch (err) {
      setError('Failed to lookup address. Please try again.');
      console.error(err);
    }

    setLoading(false);
  };

  const handleSaveProperty = async () => {
    if (!data) return;

    try {
      await fetch('/api/user/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: data.address,
          zoneCode: data.zoning?.code,
          zoneDescription: data.zoning?.description,
          isHistoric: !!data.overlays?.historic_district,
          historicDistrict: data.overlays?.historic_district,
          overlayData: data.overlays
        })
      });
      alert('Property saved!');
    } catch {
      alert('Failed to save property');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔍</span>
          <h1 className="text-xl font-bold">Property Lookup</h1>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter address (e.g., 123 Main St, Cincinnati, OH)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup(address)}
          />
          <button
            className="button"
            onClick={() => handleLookup(address)}
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Address Header */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Results for:</h2>
                <p className="text-xl">{data.address}</p>
                {data.jurisdiction && (
                  <p className="text-sm text-gray-500">
                    {data.jurisdiction.name}, {data.jurisdiction.state}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveProperty} className="button-secondary">
                  💾 Save
                </button>
              </div>
            </div>
          </div>

          {/* Zoning Section */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>🏗️</span> ZONING
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Zone:</span>
                <span className="font-semibold">{data.zoning?.code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Description:</span>
                <span>{data.zoning?.description || 'N/A'}</span>
              </div>
              {data.zoning?.development_standards && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Height:</span>
                    <span>{data.zoning.development_standards.max_height_ft ? `${data.zoning.development_standards.max_height_ft} ft` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lot Coverage:</span>
                    <span>{data.zoning.development_standards.max_lot_coverage ? `${(data.zoning.development_standards.max_lot_coverage * 100).toFixed(0)}% max` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Setbacks (front/side/rear):</span>
                    <span>
                      {data.zoning.development_standards.setbacks.front_ft || '?'}/
                      {data.zoning.development_standards.setbacks.side_ft || '?'}/
                      {data.zoning.development_standards.setbacks.rear_ft || '?'} ft
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Overlays Section */}
          <div className="card">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span>📋</span> OVERLAYS
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Historic District:</span>
                {data.overlays?.historic_district ? (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium">
                    {data.overlays.historic_district}
                  </span>
                ) : (
                  <span className="text-green-600">None</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hillside:</span>
                <span className={data.overlays?.hillside ? 'text-yellow-600' : 'text-green-600'}>
                  {data.overlays?.hillside ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Urban Design:</span>
                <span>{data.overlays?.urban_design || 'None'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Landslide Risk:</span>
                <span className={
                  data.overlays?.landslide_risk === 'High' ? 'text-red-600' :
                  data.overlays?.landslide_risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                }>
                  {data.overlays?.landslide_risk || 'Low'}
                </span>
              </div>
            </div>
          </div>

          {/* Permits Required */}
          {data.permits_required && data.permits_required.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>📜</span> PERMITS REQUIRED
              </h3>
              <ul className="space-y-2">
                {data.permits_required.map((permit, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <span>{permit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/chat?address=${encodeURIComponent(data.address)}`}
              className="button flex items-center gap-2"
            >
              💬 Ask a question about this property
            </Link>
            <button className="button-secondary flex items-center gap-2">
              📄 Generate Report
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data && !loading && !error && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Enter an address to get started</h2>
          <p className="text-gray-500">
            Look up zoning, overlays, and permit requirements for any property
          </p>
        </div>
      )}
    </div>
  );
}

export default function LookupPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse text-gray-500">Loading lookup...</div>
        </div>
      </div>
    }>
      <LookupContent />
    </Suspense>
  );
}
