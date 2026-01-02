'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PropertyData {
  address: string;
  city: string;
  state: string;
  jurisdictionId: string;
  supported: boolean;
  property?: {
    zone: string;
    zoneName: string;
    zoneType: string;
    parcelId?: string;
    lotSize?: number;
    yearBuilt?: number;
    isVacant?: boolean;
    trashDay?: string;
    parkingRatio?: string;
    far?: number;
    maxHeight?: number;
    councilDistrict?: string;
    councilRep?: string;
    constraints?: string[];
    allowedUses?: {
      permitted: string[];
      conditional: string[];
    };
    developmentStandards?: {
      minLot: number;
      frontSetback: number;
      sideSetback: number;
      rearSetback: number;
      maxHeight: number;
      maxCoverage: number;
    };
  };
  waitlistCount?: number;
}

interface AddressBarProps {
  onAddressSelect: (address: string, propertyData?: PropertyData) => void;
  onPropertyLookup?: (propertyData: PropertyData) => void;
  initialAddress?: string;
  placeholder?: string;
}

// Declare Google types for TypeScript
declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

export default function AddressBar({
  onAddressSelect,
  onPropertyLookup,
  initialAddress = '',
  placeholder = 'Enter an address or ask a question...'
}: AddressBarProps) {
  const [address, setAddress] = useState(initialAddress);
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

    return () => {
      // Cleanup not needed for Google Maps script
    };
  }, []);

  // Initialize services when Google is loaded
  useEffect(() => {
    if (googleLoaded && window.google?.maps?.places) {
      autocompleteService.current = new window.google.maps.places.AutocompleteService();
      // PlacesService needs a div element
      const div = document.createElement('div');
      placesService.current = new window.google.maps.places.PlacesService(div);
      sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [googleLoaded]);

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
      if (address.length >= 3 && googleLoaded) {
        fetchPredictions(address);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, googleLoaded, fetchPredictions]);

  // Handle prediction selection
  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setAddress(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    setIsLoading(true);

    try {
      // Get place details
      if (placesService.current) {
        placesService.current.getDetails(
          {
            placeId: prediction.place_id,
            fields: ['address_components', 'formatted_address', 'geometry'],
            sessionToken: sessionToken.current!,
          },
          async (place, status) => {
            if (status === window.google?.maps?.places?.PlacesServiceStatus.OK && place) {
              // Reset session token after successful request
              sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();

              // Parse address components
              const components = place.address_components || [];
              const city = components.find(c => c.types.includes('locality'))?.long_name;
              const state = components.find(c => c.types.includes('administrative_area_level_1'))?.short_name;
              const county = components.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
              const zip = components.find(c => c.types.includes('postal_code'))?.long_name;

              if (city && state) {
                const jurisdictionId = `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase()}`;

                // Lookup property data
                try {
                  const res = await fetch(`/api/property/lookup?address=${encodeURIComponent(place.formatted_address || prediction.description)}&jurisdictionId=${jurisdictionId}`);
                  const data = await res.json();

                  const propertyData: PropertyData = {
                    address: place.formatted_address || prediction.description,
                    city: city,
                    state: state,
                    jurisdictionId,
                    supported: data.success && data.supported !== false,
                    property: data.success ? data.property : undefined,
                    waitlistCount: data.waitlistCount,
                  };

                  onAddressSelect(prediction.description, propertyData);
                  if (onPropertyLookup) {
                    onPropertyLookup(propertyData);
                  }
                } catch (error) {
                  console.error('Property lookup error:', error);
                  onAddressSelect(prediction.description);
                }
              } else {
                onAddressSelect(prediction.description);
              }
            }
            setIsLoading(false);
          }
        );
      } else {
        // Fallback without Google Places details
        onAddressSelect(prediction.description);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Place details error:', error);
      onAddressSelect(prediction.description);
      setIsLoading(false);
    }
  };

  // Handle manual search (fallback)
  const handleSearch = async () => {
    if (!address.trim()) return;

    setIsLoading(true);
    setShowPredictions(false);

    try {
      // Use Nominatim as fallback for geocoding
      const res = await fetch(`/api/property/lookup?address=${encodeURIComponent(address)}`);
      const data = await res.json();

      if (data.success) {
        const propertyData: PropertyData = {
          address: data.property?.address || address,
          city: data.property?.city || '',
          state: 'OH', // Default to Ohio
          jurisdictionId: data.property?.cityId || 'cincinnati-oh',
          supported: true,
          property: data.property,
        };

        onAddressSelect(address, propertyData);
        if (onPropertyLookup) {
          onPropertyLookup(propertyData);
        }
      } else {
        onAddressSelect(address);
      }
    } catch (error) {
      console.error('Search error:', error);
      onAddressSelect(address);
    } finally {
      setIsLoading(false);
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
      setShowPredictions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
          placeholder={placeholder}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
          autoComplete="off"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !address.trim()}
          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>

      {/* Predictions dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <button
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 text-sm text-gray-700 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0 flex items-start gap-3"
            >
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <div>
                <div className="font-medium text-gray-800">
                  {prediction.structured_formatting?.main_text}
                </div>
                <div className="text-xs text-gray-500">
                  {prediction.structured_formatting?.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
