'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PropertyData } from './PropertyCard';

// Labeled address with A, B, C identifiers
export interface LabeledAddress {
  id: string;
  label: string; // 'A', 'B', 'C', etc.
  address: string;
  shortAddress: string; // Condensed version for chip display
  property: PropertyData | null;
  isActive: boolean;
}

interface MultiAddressBarProps {
  addresses: LabeledAddress[];
  onAddAddress: (address: string, property: PropertyData | null) => void;
  onRemoveAddress: (id: string) => void;
  onSetActiveAddress: (id: string) => void;
  onPropertyLookup?: (propertyData: any) => void;
}

// Declare Google types for TypeScript
declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

// Generate labels A, B, C, ... Z, AA, AB, etc.
export function generateLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index); // A-Z
  }
  // For more than 26, use AA, AB, etc.
  const first = Math.floor(index / 26) - 1;
  const second = index % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

// Shorten address for chip display (e.g., "123 Main St")
export function shortenAddress(address: string): string {
  // Take street number and name, drop city/state/zip
  const parts = address.split(',');
  if (parts.length > 0) {
    const street = parts[0].trim();
    // If street is too long, truncate
    if (street.length > 25) {
      return street.slice(0, 22) + '...';
    }
    return street;
  }
  return address.slice(0, 25);
}

export default function MultiAddressBar({
  addresses,
  onAddAddress,
  onRemoveAddress,
  onSetActiveAddress,
  onPropertyLookup,
}: MultiAddressBarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return;
    }

    if (window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkGoogle = setInterval(() => {
        if (window.google?.maps?.places) {
          setGoogleLoaded(true);
          clearInterval(checkGoogle);
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Initialize services when Google is loaded
  useEffect(() => {
    if (googleLoaded && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [googleLoaded]);

  // Focus input when adding mode activates
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  // Fetch predictions
  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteService.current || input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        types: ['address'],
        componentRestrictions: { country: 'us' },
        sessionToken: sessionToken.current!,
      };

      autocompleteService.current.getPlacePredictions(request, (results, status) => {
        if (status === window.google?.maps?.places?.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      });
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  }, []);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 3 && googleLoaded) {
        fetchPredictions(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, googleLoaded, fetchPredictions]);

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    setIsLoading(true);

    try {
      if (placesService.current) {
        placesService.current.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['address_components', 'formatted_address', 'geometry'],
            sessionToken: sessionToken.current!,
          },
          async (place, status) => {
            if (status === window.google?.maps?.places?.PlacesServiceStatus.OK && place) {
              sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();

              const components = place.address_components || [];
              const city = components.find(c => c.types.includes('locality'))?.long_name;
              const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name;

              if (city && state) {
                const jurisdictionId = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;

                try {
                  const res = await fetch(`/api/property/lookup?address=${encodeURIComponent(place.formatted_address || prediction.description)}&jurisdictionId=${jurisdictionId}`);
                  const data = await res.json();

                  if (data.success && data.property) {
                    onAddAddress(place.formatted_address || prediction.description, data.property);
                    if (onPropertyLookup) {
                      onPropertyLookup(data);
                    }
                  } else {
                    onAddAddress(place.formatted_address || prediction.description, null);
                  }
                } catch (error) {
                  console.error('Property lookup error:', error);
                  onAddAddress(prediction.description, null);
                }
              } else {
                onAddAddress(prediction.description, null);
              }
            }
            setIsLoading(false);
            setIsAdding(false);
            setInputValue('');
          }
        );
      } else {
        onAddAddress(prediction.description, null);
        setIsLoading(false);
        setIsAdding(false);
        setInputValue('');
      }
    } catch (error) {
      console.error('Place details error:', error);
      onAddAddress(prediction.description, null);
      setIsLoading(false);
      setIsAdding(false);
      setInputValue('');
    }
  };

  // Handle manual search
  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setShowPredictions(false);

    try {
      const res = await fetch(`/api/property/lookup?address=${encodeURIComponent(inputValue)}`);
      const data = await res.json();

      if (data.success && data.property) {
        onAddAddress(data.property.address || inputValue, data.property);
      } else {
        onAddAddress(inputValue, null);
      }
    } catch (error) {
      console.error('Search error:', error);
      onAddAddress(inputValue, null);
    } finally {
      setIsLoading(false);
      setIsAdding(false);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (predictions.length > 0 && showPredictions) {
        handleSelectPrediction(predictions[0]);
      } else {
        handleSearch();
      }
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setInputValue('');
      setShowPredictions(false);
    }
  };

  const handleStartAdding = () => {
    setIsAdding(true);
  };

  const activeAddress = addresses.find(a => a.isActive);

  return (
    <div className="relative">
      {/* Address chips row */}
      <div className="flex items-center gap-2 flex-wrap">
        {addresses.map((addr) => (
          <button
            key={addr.id}
            onClick={() => onSetActiveAddress(addr.id)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
              addr.isActive
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {/* Location pin icon */}
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">{addr.shortAddress}</span>
            {/* Label badge */}
            <span className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
              addr.isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {addr.label}
            </span>
            {/* Remove button (visible on hover) */}
            {addresses.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveAddress(addr.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-300 rounded-full"
                title="Remove address"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </button>
        ))}

        {/* Add button or input */}
        {isAdding ? (
          <div className="relative flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-full px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  setTimeout(() => {
                    if (!showPredictions) {
                      setIsAdding(false);
                      setInputValue('');
                    }
                  }, 200);
                }}
                placeholder="Add another address..."
                className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                autoComplete="off"
              />
              {isLoading && (
                <svg className="w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
            </div>

            {/* Predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-800 text-xs">
                      {prediction.structured_formatting?.main_text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prediction.structured_formatting?.secondary_text}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleStartAdding}
            className="flex items-center gap-1 px-2 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors text-sm"
            title="Add another address"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {addresses.length === 0 && <span>Add address</span>}
          </button>
        )}
      </div>
    </div>
  );
}
