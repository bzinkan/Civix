'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PropertyData } from './PropertyCard';

interface AddressInputProps {
  onAddressSelect: (address: string, property: PropertyData | null) => void;
  onPropertyLookup?: (propertyData: any) => void;
  placeholder?: string;
  className?: string;
}

// Declare Google types for TypeScript
declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

export default function AddressInput({
  onAddressSelect,
  onPropertyLookup,
  placeholder = 'Enter an address for property-specific answers...',
  className = '',
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Derived state for button enabled - ensures re-render on input change
  const hasInput = inputValue.trim().length > 0;
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
                    onAddressSelect(place.formatted_address || prediction.description, data.property);
                    if (onPropertyLookup) {
                      onPropertyLookup(data);
                    }
                  } else {
                    onAddressSelect(place.formatted_address || prediction.description, null);
                  }
                } catch (error) {
                  console.error('Property lookup error:', error);
                  onAddressSelect(prediction.description, null);
                }
              } else {
                onAddressSelect(prediction.description, null);
              }
            }
            setIsLoading(false);
            setInputValue(''); // Clear input after selection
          }
        );
      } else {
        onAddressSelect(prediction.description, null);
        setIsLoading(false);
        setInputValue('');
      }
    } catch (error) {
      console.error('Place details error:', error);
      onAddressSelect(prediction.description, null);
      setIsLoading(false);
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
        onAddressSelect(data.property.address || inputValue, data.property);
        if (onPropertyLookup) {
          onPropertyLookup(data);
        }
      } else {
        onAddressSelect(inputValue, null);
      }
    } catch (error) {
      console.error('Search error:', error);
      onAddressSelect(inputValue, null);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (predictions.length > 0 && showPredictions) {
        handleSelectPrediction(predictions[0]);
      } else if (inputValue.trim()) {
        handleSearch();
      }
    }
    if (e.key === 'Escape') {
      setShowPredictions(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowPredictions(true)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
          autoComplete="off"
        />
        {isLoading ? (
          <svg className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <button
            onClick={handleSearch}
            disabled={!hasInput}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex-shrink-0 ${
              hasInput
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Search
          </button>
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
  );
}
