'use client';

import { useState } from 'react';
import { LocationInput, LocationData } from '@/components/location-input';
import ChatInterface from '@/components/chat-interface';

interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  type: string;
  hasOrdinances: boolean;
  ordinanceCount: number;
}

export default function OrdinancesPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = async (newLocation: LocationData | null) => {
    setLocation(newLocation);
    setJurisdiction(null);
    setError(null);

    if (!newLocation) return;

    // Look up jurisdiction
    try {
      const response = await fetch(
        `/api/jurisdictions/lookup?city=${encodeURIComponent(newLocation.city)}&state=${encodeURIComponent(newLocation.state)}`
      );

      const data = await response.json();

      if (data.found) {
        setJurisdiction(data.jurisdiction);
      } else {
        setError(data.message + ' ' + (data.suggestion || ''));
      }
    } catch (err: any) {
      setError('Failed to lookup jurisdiction');
    }
  };

  const handleReset = () => {
    setLocation(null);
    setJurisdiction(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ordinance Assistant
          </h1>
          <p className="text-gray-600">
            Ask questions about local ordinances and regulations
          </p>
        </div>

        {/* Step 1: Location Input (show only if no jurisdiction selected) */}
        {!jurisdiction && (
          <>
            <LocationInput
              onLocationChange={handleLocationChange}
              className="mb-6"
            />

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </>
        )}

        {/* Step 2: Jurisdiction Confirmation */}
        {jurisdiction && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-green-900">
                Found {jurisdiction.ordinanceCount.toLocaleString()} ordinance sections
              </h3>
            </div>
          </div>
        )}

        {/* Step 3: Chat Interface */}
        {jurisdiction && (
          <ChatInterface
            jurisdiction={jurisdiction}
            onReset={handleReset}
          />
        )}

        {/* Help Text (when no jurisdiction selected) */}
        {!jurisdiction && !error && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">
              How it works
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <p>1. Enter your city and state (or full address)</p>
              <p>2. Start asking questions about local ordinances</p>
              <p>3. Get instant answers with source citations</p>
              <p>4. Ask follow-up questions to dive deeper</p>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                Example questions you can ask:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Can I build a fence in my front yard?</li>
                <li>• What are the height requirements?</li>
                <li>• What happens if I violate the fence ordinance?</li>
                <li>• Do I need a permit for a shed?</li>
                <li>• What are the noise ordinances?</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
