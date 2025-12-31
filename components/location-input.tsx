'use client';

import { useState } from 'react';

export interface LocationData {
  address?: string;
  city: string;
  state: string;
  zipCode?: string;
}

interface LocationInputProps {
  onLocationChange: (location: LocationData | null) => void;
  className?: string;
}

export function LocationInput({ onLocationChange, className = '' }: LocationInputProps) {
  const [inputMode, setInputMode] = useState<'city' | 'address'>('city');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // US States for dropdown
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const handleCitySubmit = () => {
    if (!city || !state) {
      setError('Please enter both city and state');
      return;
    }

    setError(null);
    onLocationChange({
      city: city.trim(),
      state: state.trim(),
    });
  };

  const handleAddressSubmit = async () => {
    if (!address) {
      setError('Please enter an address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call geocoding API to resolve address to city/state
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();

      if (!data.city || !data.state) {
        throw new Error('Could not determine city from address');
      }

      onLocationChange({
        address: address.trim(),
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process address');
      onLocationChange(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'city') {
      handleCitySubmit();
    } else {
      handleAddressSubmit();
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Where are you located?</h3>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setInputMode('city')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            inputMode === 'city'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          City & State
        </button>
        <button
          type="button"
          onClick={() => setInputMode('address')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            inputMode === 'address'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Full Address
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputMode === 'city' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cincinnati"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state...</option>
                {usStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Full Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Cincinnati, OH 45202"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              We'll automatically detect your city from the address
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
