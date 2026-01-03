'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SavedProperty {
  id: string;
  address: string;
  nickname: string | null;
  zoneCode: string | null;
  zoneName: string | null;
  zoneType: string | null;
  constraints: string[];
  lastAccessed: string;
  createdAt: string;
  conversationCount?: number;
  lastMessage?: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data.properties) {
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress }),
      });

      if (res.ok) {
        setNewAddress('');
        setShowAddForm(false);
        fetchProperties();
      }
    } catch (error) {
      console.error('Failed to add property:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  const getZoneIcon = (zoneType: string | null) => {
    switch (zoneType) {
      case 'residential': return '🏠';
      case 'commercial': return '🏢';
      case 'downtown': return '🏙️';
      case 'industrial': return '🏭';
      case 'public': return '🏛️';
      case 'parks': return '🌳';
      default: return '📍';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Properties</h1>
            <p className="text-gray-500">Your saved properties</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>Add Property</span>
          </button>
        </div>

        {/* Add Property Form */}
        {showAddForm && (
          <form onSubmit={handleAddProperty} className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex gap-3">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Enter property address..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                disabled={isAdding || !newAddress.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Properties List */}
        {properties.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
            <div className="text-4xl mb-4">📍</div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No saved properties</h3>
            <p className="text-gray-500 mb-4">
              Save properties to keep track of your permit and zoning research
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Property
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getZoneIcon(property.zoneType)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {property.nickname || property.address}
                        </h3>
                        {property.nickname && (
                          <p className="text-sm text-gray-500">{property.address}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {property.zoneCode && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {property.zoneCode}
                            </span>
                          )}
                          {property.zoneName && (
                            <span className="text-xs text-gray-500">{property.zoneName}</span>
                          )}
                        </div>
                        {property.lastMessage && (
                          <p className="text-sm text-gray-500 mt-2 truncate max-w-md">
                            Last: "{property.lastMessage}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/properties/${property.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open Chat
                      </Link>
                      <button
                        onClick={() => handleDeleteProperty(property.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete property"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
