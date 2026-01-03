'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface SavedLocation {
  id: string;
  label: string;
  scopeType: 'city' | 'county' | 'metro' | 'state';
  state: string;
  city?: string;
  county?: string;
  fips?: string;
  metroCounties?: Array<{ county: string; state: string; fips: string }>;
}

export interface MetroOption {
  id: string;
  label: string;
  countyCount: number;
}

interface LocationContextType {
  locations: SavedLocation[];
  activeLocationId: string | null;
  activeLocation: SavedLocation | null;
  metroOptions: MetroOption[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchLocations: () => Promise<void>;
  addLocation: (data: {
    scopeType: string;
    state: string;
    city?: string;
    county?: string;
    metroId?: string;
    label?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  removeLocation: (id: string) => Promise<void>;
  setActiveLocation: (id: string) => Promise<void>;
  updateLocationLabel: (id: string, label: string) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [metroOptions, setMetroOptions] = useState<MetroOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeLocation = locations.find(l => l.id === activeLocationId) || null;

  const fetchLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/locations');
      const data = await res.json();

      if (data.success) {
        setLocations(data.locations || []);
        setActiveLocationId(data.activeLocationId || null);
        setMetroOptions(data.metroOptions || []);
      } else {
        setError(data.error || 'Failed to fetch locations');
      }
    } catch (err) {
      setError('Failed to fetch locations');
      console.error('Location fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLocation = useCallback(async (data: {
    scopeType: string;
    state: string;
    city?: string;
    county?: string;
    metroId?: string;
    label?: string;
  }) => {
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.success) {
        await fetchLocations();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to add location' };
    }
  }, [fetchLocations]);

  const removeLocation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/locations?id=${id}`, { method: 'DELETE' });
      await fetchLocations();
    } catch (err) {
      console.error('Failed to remove location:', err);
    }
  }, [fetchLocations]);

  const setActiveLocation = useCallback(async (id: string) => {
    try {
      const res = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: id, setActive: true }),
      });
      const result = await res.json();

      if (result.success) {
        setActiveLocationId(id);
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('civix-location-changed', {
          detail: { locationId: id, message: result.message }
        }));
      }
    } catch (err) {
      console.error('Failed to set active location:', err);
    }
  }, []);

  const updateLocationLabel = useCallback(async (id: string, label: string) => {
    try {
      await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: id, label }),
      });
      await fetchLocations();
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  }, [fetchLocations]);

  // Fetch on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  return (
    <LocationContext.Provider value={{
      locations,
      activeLocationId,
      activeLocation,
      metroOptions,
      isLoading,
      error,
      fetchLocations,
      addLocation,
      removeLocation,
      setActiveLocation,
      updateLocationLabel,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
