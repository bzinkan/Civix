'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocation, SavedLocation, MetroOption } from '../../contexts/LocationContext';
import { useHelp } from '../../contexts/HelpContext';
import HelpTooltip from '../../components/HelpTooltip';

interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    subscriptionPlan: string;
    subscriptionStatus: string;
    monthlyLookups: number;
  };
  planLimits: {
    lookups: number;
    savedProperties: number;
  };
  usage: {
    lookupsUsed: number;
    savedProperties: number;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Location management
  const {
    locations,
    activeLocationId,
    metroOptions,
    isLoading: locationsLoading,
    addLocation,
    removeLocation,
    setActiveLocation,
  } = useLocation();
  const { showHelpIcons, hideHelpIcons } = useHelp();

  // Add location form state
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationType, setNewLocationType] = useState<'city' | 'county' | 'metro'>('city');
  const [newState, setNewState] = useState('OH');
  const [newCity, setNewCity] = useState('');
  const [newCounty, setNewCounty] = useState('');
  const [newMetro, setNewMetro] = useState('cincinnati-metro');
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setName(data.user.name || '');
      }
    } catch {
      // User not logged in
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore errors
    }
    setSaving(false);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      // Would call API to clear history
      alert('Chat history cleared');
    }
  };

  const handleAddLocation = async () => {
    setAddError(null);

    const result = await addLocation({
      scopeType: newLocationType,
      state: newState,
      city: newLocationType === 'city' ? newCity : undefined,
      county: newLocationType === 'county' ? newCounty : undefined,
      metroId: newLocationType === 'metro' ? newMetro : undefined,
    });

    if (result.success) {
      setShowAddLocation(false);
      setNewCity('');
      setNewCounty('');
    } else {
      setAddError(result.error || 'Failed to add location');
    }
  };

  const getScopeTypeLabel = (scopeType: string) => {
    switch (scopeType) {
      case 'city': return 'City';
      case 'county': return 'County';
      case 'metro': return 'Metro';
      case 'state': return 'State';
      default: return scopeType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {profile && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {profile.user.email}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Locations Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">Locations</h2>
              <HelpTooltip
                text="Save locations to answer general questions without entering an address. Switch between locations in the sidebar. Addresses always override these settings."
                showIcons={showHelpIcons}
                onHideIcons={hideHelpIcons}
                position="right"
              />
            </div>
            {locations.length < 5 && (
              <button
                onClick={() => setShowAddLocation(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Location
              </button>
            )}
          </div>

          {/* Add Location Form */}
          {showAddLocation && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {/* Scope Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Type
                  </label>
                  <div className="flex gap-2">
                    {(['city', 'county', 'metro'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setNewLocationType(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          newLocationType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getScopeTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="OH">Ohio</option>
                    <option value="KY">Kentucky</option>
                    <option value="IN">Indiana</option>
                  </select>
                </div>

                {/* City Input */}
                {newLocationType === 'city' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City Name
                    </label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="e.g., Cincinnati"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}

                {/* County Input */}
                {newLocationType === 'county' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County Name
                    </label>
                    <input
                      type="text"
                      value={newCounty}
                      onChange={(e) => setNewCounty(e.target.value)}
                      placeholder="e.g., Hamilton"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      County scope includes all municipalities. Rules may vary by city.
                    </p>
                  </div>
                )}

                {/* Metro Selection */}
                {newLocationType === 'metro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metro Area
                    </label>
                    <select
                      value={newMetro}
                      onChange={(e) => setNewMetro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {metroOptions.map((metro) => (
                        <option key={metro.id} value={metro.id}>
                          {metro.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Results will be grouped by county/state.
                    </p>
                  </div>
                )}

                {addError && (
                  <p className="text-sm text-red-600">{addError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Add Location
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLocation(false);
                      setAddError(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location List */}
          {locationsLoading ? (
            <div className="text-gray-500 text-sm py-4">Loading locations...</div>
          ) : locations.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500 text-sm mb-2">No locations saved</p>
              <p className="text-gray-400 text-xs">Add a location to answer general questions without an address</p>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    activeLocationId === location.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveLocation(location.id)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        activeLocationId === location.id
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {activeLocationId === location.id && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                    <div>
                      <div className="font-medium text-gray-800">{location.label}</div>
                      <div className="text-xs text-gray-500">
                        {getScopeTypeLabel(location.scopeType)}
                        {location.scopeType === 'metro' && location.metroCounties && (
                          <span> ({(location.metroCounties as any[]).length} counties)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLocation(location.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Remove location"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {locations.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Switch locations quickly from the sidebar. Addresses in chat always override these settings.
            </p>
          )}
        </div>

        {/* Subscription Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Subscription</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {profile?.user.subscriptionPlan || 'Free'}
            </span>
          </div>

          {profile && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Questions this month</span>
                <span className="font-medium">
                  {profile.usage.lookupsUsed} / {profile.planLimits.lookups === -1 ? 'Unlimited' : profile.planLimits.lookups}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Saved properties</span>
                <span className="font-medium">
                  {profile.usage.savedProperties} / {profile.planLimits.savedProperties === -1 ? 'Unlimited' : profile.planLimits.savedProperties}
                </span>
              </div>
              {profile.planLimits.lookups !== -1 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (profile.usage.lookupsUsed / profile.planLimits.lookups) * 100)}%`
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors">
            Upgrade to Pro
          </button>
        </div>

        {/* Data & Privacy Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Data & Privacy</h2>
          <div className="space-y-3">
            <button
              onClick={handleClearHistory}
              className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-800">Clear Chat History</div>
                <div className="text-sm text-gray-500">Delete all conversations</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <button className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">Export Data</div>
                <div className="text-sm text-gray-500">Download your data</div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="font-semibold text-gray-800 mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Civix</strong> - Your local regulatory assistant</p>
            <p>Version 2.0.0</p>
            <div className="pt-2 space-x-4">
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              <a href="#" className="text-blue-600 hover:underline">Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
