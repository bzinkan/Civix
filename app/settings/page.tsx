'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type UserType = 'homeowner' | 'contractor' | 'realtor' | 'title' | 'legal' | 'developer' | 'small_business';

interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    userType: UserType;
    companyName: string | null;
    licenseNumber: string | null;
    subscriptionPlan: string;
    subscriptionStatus: string;
    monthlyLookups: number;
  };
  typeConfig: {
    label: string;
    description: string;
    features: string[];
  };
  planLimits: {
    lookups: number;
    savedProperties: number;
    reports: number;
  };
  usage: {
    lookupsUsed: number;
    lookupsRemaining: number | string;
    savedProperties: number;
    propertiesRemaining: number | string;
  };
}

const USER_TYPES: { id: UserType; label: string; icon: string }[] = [
  { id: 'homeowner', label: 'Homeowner', icon: '🏠' },
  { id: 'contractor', label: 'Contractor', icon: '🔨' },
  { id: 'realtor', label: 'Real Estate', icon: '🏢' },
  { id: 'small_business', label: 'Small Business', icon: '🏪' },
  { id: 'legal', label: 'Legal', icon: '⚖️' },
  { id: 'title', label: 'Title & Escrow', icon: '📜' },
  { id: 'developer', label: 'Developer', icon: '🏗️' }
];

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<UserType>('homeowner');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

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
        setUserType(data.user.userType);
        setCompanyName(data.user.companyName || '');
        setLicenseNumber(data.user.licenseNumber || '');
      }
    } catch {
      // Load from localStorage for unauthenticated users
      const storedType = localStorage.getItem('civix_userType') as UserType;
      if (storedType) {
        setUserType(storedType);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);

    // Update localStorage
    localStorage.setItem('civix_userType', userType);

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          userType,
          companyName,
          licenseNumber
        })
      });
    } catch {
      // Ignore errors for unauthenticated users
    }

    setSaving(false);
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚙️</span>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="card">
        <h2 className="font-bold text-lg mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">User Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {USER_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-colors ${
                    userType === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {(userType === 'contractor' || userType === 'realtor' || userType === 'developer') && (
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <input
                type="text"
                className="input"
                placeholder="Your company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          )}

          {userType === 'contractor' && (
            <div>
              <label className="block text-sm font-medium mb-1">License Number</label>
              <input
                type="text"
                className="input"
                placeholder="Contractor license #"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Plan Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Plan</h2>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
            {profile?.user.subscriptionPlan || 'Free'}
          </span>
        </div>

        {profile && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Lookups this month:</span>
              <span>
                {profile.usage.lookupsUsed} / {profile.planLimits.lookups === -1 ? '∞' : profile.planLimits.lookups}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Saved properties:</span>
              <span>
                {profile.usage.savedProperties} / {profile.planLimits.savedProperties === -1 ? '∞' : profile.planLimits.savedProperties}
              </span>
            </div>
            {profile.planLimits.lookups !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, (profile.usage.lookupsUsed / profile.planLimits.lookups) * 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        )}

        <button className="button mt-4 w-full">
          Upgrade Plan
        </button>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => router.back()}
          className="button-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="button"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
