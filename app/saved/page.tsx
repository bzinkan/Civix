'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SavedProperty {
  id: string;
  address: string;
  nickname?: string;
  zoneCode?: string;
  zoneDescription?: string;
  isHistoric: boolean;
  historicDistrict?: string;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'properties' | 'reports' | 'forms' | 'searches';

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<TabType>('properties');
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newNickname, setNewNickname] = useState('');

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/user/properties');
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch {
      // Use placeholder data
      setProperties([
        {
          id: '1',
          address: '123 Main St, Cincinnati, OH',
          nickname: 'Main House',
          zoneCode: 'SF-4',
          zoneDescription: 'Single Family Residential',
          isHistoric: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          address: '456 Oak Ave, Cincinnati, OH',
          nickname: 'Rental Property',
          zoneCode: 'RM-2',
          zoneDescription: 'Multi-Family Residential',
          isHistoric: true,
          historicDistrict: 'Over-the-Rhine',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]);
    }
    setLoading(false);
  };

  const handleAddProperty = async () => {
    if (!newAddress.trim()) return;

    try {
      const response = await fetch('/api/user/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: newAddress,
          nickname: newNickname || undefined
        })
      });

      if (response.ok) {
        await loadProperties();
        setShowAddModal(false);
        setNewAddress('');
        setNewNickname('');
      }
    } catch (error) {
      console.error('Failed to add property:', error);
    }
  };

  const handleRemoveProperty = async (id: string) => {
    // TODO: Implement delete endpoint
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'properties', label: 'Properties', icon: '📍' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'forms', label: 'Forms', icon: '📋' },
    { id: 'searches', label: 'Searches', icon: '🔍' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <h1 className="text-xl font-bold">Saved</h1>
          </div>
          <button onClick={() => setShowAddModal(true)} className="button">
            + Add Property
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'properties' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card text-center py-8">Loading...</div>
          ) : properties.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-4">📍</div>
              <h2 className="text-xl font-bold mb-2">No saved properties</h2>
              <p className="text-gray-500 mb-4">
                Save properties to quickly access their zoning and compliance info
              </p>
              <button onClick={() => setShowAddModal(true)} className="button">
                + Add Property
              </button>
            </div>
          ) : (
            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Address</th>
                    <th className="pb-2">Zone</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((prop) => (
                    <tr key={prop.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{prop.address}</div>
                        {prop.nickname && (
                          <div className="text-sm text-gray-500">{prop.nickname}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{prop.zoneCode}</span>
                        {prop.zoneDescription && (
                          <div className="text-sm text-gray-500">{prop.zoneDescription}</div>
                        )}
                      </td>
                      <td className="py-3">
                        {prop.isHistoric ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                            Historic: {prop.historicDistrict}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            No issues
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/lookup?address=${encodeURIComponent(prop.address)}`}
                            className="text-blue-600 text-sm hover:underline"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleRemoveProperty(prop.id)}
                            className="text-red-600 text-sm hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-xl font-bold mb-2">No saved reports</h2>
          <p className="text-gray-500 mb-4">
            Generated reports will appear here
          </p>
          <Link href="/tools/zoning-report" className="button">
            Generate a Report
          </Link>
        </div>
      )}

      {activeTab === 'forms' && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-xl font-bold mb-2">No saved forms</h2>
          <p className="text-gray-500 mb-4">
            Downloaded forms will appear here
          </p>
          <Link href="/tools/forms" className="button">
            Browse Forms
          </Link>
        </div>
      )}

      {activeTab === 'searches' && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">No saved searches</h2>
          <p className="text-gray-500">
            Your recent searches will appear here
          </p>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Add Property</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123 Main St, Cincinnati, OH"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nickname (optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Main House, Rental #1"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProperty}
                  className="button"
                  disabled={!newAddress.trim()}
                >
                  Add Property
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
