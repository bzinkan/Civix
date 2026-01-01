'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UsageStats, UpgradeBanner } from '../../components/UpgradePrompt';

interface UsageData {
  plan: string;
  lookups: {
    used: number;
    limit: number;
    unlimited: boolean;
    resetDate: string | null;
  };
  savedProperties: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  reports: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  features: {
    docUpload: boolean;
    pdfReports: boolean;
    bulkLookup: boolean;
    apiAccess: boolean;
  };
}

type UserType = 'homeowner' | 'contractor' | 'realtor' | 'title' | 'legal' | 'developer' | 'small_business';

interface DashboardData {
  userType: UserType;
  userName: string;
  companyName?: string;
  plan: string;
  dashboard: {
    greeting: string;
    widgets: Array<{
      id: string;
      title: string;
      type: string;
      data?: unknown;
    }>;
    quickActions: Array<{
      label: string;
      action: string;
      icon: string;
    }>;
    tools: Array<{
      label: string;
      path: string;
      icon: string;
      description: string;
    }>;
  };
}

interface PropertyData {
  address: string;
  zoning?: {
    code: string;
    description: string;
  };
  overlays?: {
    historic_district?: string;
    is_historic?: boolean;
  };
}

interface SavedProperty {
  id: string;
  address: string;
  nickname?: string;
  zoneCode?: string;
  isHistoric?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [homeAddress, setHomeAddress] = useState('');
  const [lookupAddress, setLookupAddress] = useState('');
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    // Check if user has selected a type
    const storedType = localStorage.getItem('civix_userType');
    if (!storedType) {
      router.push('/onboarding');
      return;
    }

    const loadDashboard = async () => {
      try {
        const response = await fetch('/api/user/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      }

      // Load saved properties
      try {
        const propsResponse = await fetch('/api/user/properties');
        if (propsResponse.ok) {
          const propsData = await propsResponse.json();
          setSavedProperties(propsData.properties || []);
        }
      } catch {
        // Use placeholder data
        setSavedProperties([
          { id: '1', address: '123 Main St, Cincinnati', zoneCode: 'SF-4', isHistoric: false },
          { id: '2', address: '456 Oak Ave, Cincinnati', zoneCode: 'RM-2', isHistoric: true }
        ]);
      }

      // Load usage stats
      try {
        const usageResponse = await fetch('/api/user/usage');
        if (usageResponse.ok) {
          const usage = await usageResponse.json();
          setUsageData(usage);
        }
      } catch {
        // Use default free tier data
        setUsageData({
          plan: 'free',
          lookups: { used: 2, limit: 5, unlimited: false, resetDate: null },
          savedProperties: { used: 1, limit: 1, unlimited: false },
          reports: { used: 0, limit: 0, unlimited: false },
          features: { docUpload: false, pdfReports: false, bulkLookup: false, apiAccess: false }
        });
      }

      setLoading(false);
    };

    loadDashboard();
  }, [router]);

  const handleLookup = async (address: string) => {
    if (!address.trim()) return;

    setLookupLoading(true);
    try {
      const response = await fetch('/api/zoning/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (response.ok) {
        const data = await response.json();
        setPropertyData(data);
      }
    } catch (error) {
      console.error('Lookup failed:', error);
    }
    setLookupLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  const userType = dashboardData?.userType || 'homeowner';

  // Render different dashboards based on user type
  switch (userType) {
    case 'contractor':
      return <ContractorDashboard data={dashboardData} savedProperties={savedProperties} onLookup={handleLookup} lookupLoading={lookupLoading} propertyData={propertyData} lookupAddress={lookupAddress} setLookupAddress={setLookupAddress} usageData={usageData} />;
    case 'realtor':
      return <RealtorDashboard data={dashboardData} savedProperties={savedProperties} onLookup={handleLookup} lookupLoading={lookupLoading} propertyData={propertyData} lookupAddress={lookupAddress} setLookupAddress={setLookupAddress} usageData={usageData} />;
    case 'small_business':
      return <SmallBusinessDashboard data={dashboardData} onLookup={handleLookup} lookupLoading={lookupLoading} lookupAddress={lookupAddress} setLookupAddress={setLookupAddress} usageData={usageData} />;
    case 'legal':
    case 'title':
      return <LegalDashboard data={dashboardData} savedProperties={savedProperties} onLookup={handleLookup} lookupLoading={lookupLoading} lookupAddress={lookupAddress} setLookupAddress={setLookupAddress} usageData={usageData} />;
    case 'developer':
      return <DeveloperDashboard data={dashboardData} savedProperties={savedProperties} onLookup={handleLookup} lookupLoading={lookupLoading} lookupAddress={lookupAddress} setLookupAddress={setLookupAddress} usageData={usageData} />;
    default:
      return <HomeownerDashboard data={dashboardData} homeAddress={homeAddress} setHomeAddress={setHomeAddress} propertyData={propertyData} onLookup={handleLookup} lookupLoading={lookupLoading} usageData={usageData} />;
  }
}

// Homeowner Dashboard Component
function HomeownerDashboard({ data, homeAddress, setHomeAddress, propertyData, onLookup, lookupLoading, usageData }: {
  data: DashboardData | null;
  homeAddress: string;
  setHomeAddress: (val: string) => void;
  propertyData: PropertyData | null;
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  usageData: UsageData | null;
}) {
  return (
    <div className="space-y-6">
      {/* Upgrade Banner for Free Users */}
      {usageData?.plan === 'free' && usageData.lookups.used >= 3 && (
        <UpgradeBanner
          message={`You've used ${usageData.lookups.used} of ${usageData.lookups.limit} free lookups`}
          requiredPlan="pro"
        />
      )}

      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h1 className="text-xl font-bold">My Home</h1>
              <p className="text-gray-500">{data?.dashboard.greeting}</p>
            </div>
          </div>
          {usageData && (
            <div className="text-sm text-gray-500">
              Plan: <span className="font-medium capitalize">{usageData.plan}</span>
            </div>
          )}
        </div>

        {/* Address Input */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter your address..."
            value={homeAddress}
            onChange={(e) => setHomeAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onLookup(homeAddress)}
          />
          <button
            className="button"
            onClick={() => onLookup(homeAddress)}
            disabled={lookupLoading}
          >
            {lookupLoading ? 'Looking up...' : 'Set Address'}
          </button>
        </div>
      </div>

      {/* Property Info Cards */}
      {propertyData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-2xl mb-2">🏗️</div>
            <div className="font-semibold">Zone: {propertyData.zoning?.code || 'N/A'}</div>
            <div className="text-sm text-gray-500">{propertyData.zoning?.description}</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-2">🗓️</div>
            <div className="font-semibold">Trash: Tuesday</div>
            <div className="text-sm text-gray-500">Recycling: Tuesday</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl mb-2">🏛️</div>
            <div className="font-semibold">Council: District 1</div>
            <div className="text-sm text-gray-500">Rep: John Smith</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h2 className="font-bold mb-4">Quick Actions</h2>
        <div className="space-y-2">
          {(data?.dashboard.quickActions || [
            { label: 'Do I need a permit?', action: '/chat?prompt=permit', icon: '🔨' },
            { label: 'What can I build?', action: '/chat?prompt=build', icon: '📋' },
            { label: 'Parking rules', action: '/chat?prompt=parking', icon: '🚗' },
            { label: 'Pet regulations', action: '/chat?prompt=pets', icon: '🐕' },
            { label: 'Rent out my home (Airbnb)', action: '/chat?prompt=airbnb', icon: '🏠' },
            { label: 'Report an issue', action: '/report', icon: '📞' }
          ]).map((action, i) => (
            <Link
              key={i}
              href={action.action}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-xl">{action.icon}</span>
              <span className="font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="font-bold mb-4">Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data?.dashboard.tools || []).map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold">{tool.label}</div>
              <div className="text-sm text-gray-500">{tool.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Contractor Dashboard Component
function ContractorDashboard({ data, savedProperties, onLookup, lookupLoading, propertyData, lookupAddress, setLookupAddress, usageData }: {
  data: DashboardData | null;
  savedProperties: SavedProperty[];
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  propertyData: PropertyData | null;
  lookupAddress: string;
  setLookupAddress: (val: string) => void;
  usageData: UsageData | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔨</span>
            <div>
              <h1 className="text-xl font-bold">Contractor Dashboard</h1>
              <p className="text-gray-500">{data?.companyName || 'Ready to check a job site?'}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Plan: <span className="capitalize">{usageData?.plan || data?.plan || 'Free'}</span></div>
        </div>
      </div>

      {/* Usage Stats */}
      {usageData && (
        <UsageStats
          lookups={usageData.lookups}
          savedProperties={usageData.savedProperties}
          plan={usageData.plan}
        />
      )}

      {/* Quick Lookup */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📍</span>
          <h2 className="font-bold">Quick Lookup</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter job site address..."
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}
          />
          <button
            className="button"
            onClick={() => router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}
          >
            Go
          </button>
        </div>
      </div>

      {/* Recent Lookups */}
      <div className="card">
        <h2 className="font-bold mb-4">Recent Lookups</h2>
        <div className="space-y-2">
          {savedProperties.slice(0, 5).map((prop) => (
            <Link
              key={prop.id}
              href={`/lookup?address=${encodeURIComponent(prop.address)}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{prop.address}</div>
                <div className="text-sm text-gray-500">Zone: {prop.zoneCode || 'N/A'}</div>
              </div>
              <div className="flex items-center gap-2">
                {prop.isHistoric && <span className="text-yellow-600">📋 Historic</span>}
                <span className={prop.isHistoric ? 'text-yellow-600' : 'text-green-600'}>
                  {prop.isHistoric ? '⚠️' : '✅'}
                </span>
              </div>
            </Link>
          ))}
          {savedProperties.length === 0 && (
            <p className="text-gray-500 text-center py-4">No recent lookups</p>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="font-bold mb-4">Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Permit Checker', path: '/tools/permit-checker', icon: '📋', description: 'Check permit requirements' },
            { label: 'Compliance Calculator', path: '/tools/compliance', icon: '✅', description: 'Upload site plan' },
            { label: 'Fee Estimator', path: '/tools/fees', icon: '💰', description: 'Estimate permit fees' },
            { label: 'Bulk Lookup', path: '/tools/bulk', icon: '📊', description: 'Check multiple addresses' }
          ].map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow text-center">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold text-sm">{tool.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Saved Forms */}
      <div className="card">
        <div className="flex items-center gap-2">
          <span className="text-xl">📎</span>
          <h2 className="font-bold">Saved Forms</h2>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Deck Checklist</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">Permit App</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">HVAC App</span>
        </div>
      </div>
    </div>
  );
}

// Realtor Dashboard Component
function RealtorDashboard({ data, savedProperties, onLookup, lookupLoading, propertyData, lookupAddress, setLookupAddress, usageData }: {
  data: DashboardData | null;
  savedProperties: SavedProperty[];
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  propertyData: PropertyData | null;
  lookupAddress: string;
  setLookupAddress: (val: string) => void;
  usageData: UsageData | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏢</span>
            <div>
              <h1 className="text-xl font-bold">Real Estate Pro</h1>
              <p className="text-gray-500">{data?.userName || 'Agent Name'}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Plan: <span className="capitalize">{usageData?.plan || 'Free'}</span></div>
        </div>
      </div>

      {/* Usage Stats */}
      {usageData && (
        <UsageStats
          lookups={usageData.lookups}
          savedProperties={usageData.savedProperties}
          plan={usageData.plan}
        />
      )}

      {/* Property Lookup */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📍</span>
          <h2 className="font-bold">Property Lookup</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter address..."
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}
          />
          <button className="button" onClick={() => router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}>
            Go
          </button>
        </div>
      </div>

      {/* Saved Properties */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">My Saved Properties</h2>
          <button className="button-secondary text-sm">+ Add New</button>
        </div>
        <div className="overflow-x-auto">
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
              {savedProperties.map((prop) => (
                <tr key={prop.id} className="border-b last:border-0">
                  <td className="py-3">{prop.address}</td>
                  <td className="py-3">{prop.zoneCode || 'N/A'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs ${prop.isHistoric ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {prop.isHistoric ? 'Historic' : 'No issues'}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    <button className="text-blue-600 text-sm">Report</button>
                    <button className="text-blue-600 text-sm">Share</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="font-bold mb-4">Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Zoning Report', icon: '📋', path: '/tools/zoning-report' },
            { label: 'Development Potential', icon: '📈', path: '/tools/dev-potential' },
            { label: 'Find Sites', icon: '🗺️', path: '/tools/site-finder' },
            { label: 'Client Reports', icon: '📤', path: '/tools/client-reports' }
          ].map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow text-center">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold text-sm">{tool.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Small Business Dashboard
function SmallBusinessDashboard({ data, onLookup, lookupLoading, lookupAddress, setLookupAddress, usageData }: {
  data: DashboardData | null;
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  lookupAddress: string;
  setLookupAddress: (val: string) => void;
  usageData: UsageData | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h1 className="text-xl font-bold">Small Business</h1>
              <p className="text-gray-500">{data?.companyName || 'Starting or running a business?'}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Plan: <span className="capitalize">{usageData?.plan || 'Free'}</span></div>
        </div>
      </div>

      {/* Usage Stats */}
      {usageData && (
        <UsageStats
          lookups={usageData.lookups}
          savedProperties={usageData.savedProperties}
          plan={usageData.plan}
        />
      )}

      {/* Location Check */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📍</span>
          <h2 className="font-bold">Business Location</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter business address..."
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
          />
          <button className="button" onClick={() => router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}>
            Go
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="card">
        <h2 className="font-bold mb-4">Quick Questions</h2>
        <div className="space-y-2">
          {[
            { label: 'What licenses do I need?', action: '/chat?prompt=business+licenses' },
            { label: 'Can I put up a sign?', action: '/chat?prompt=business+sign+permit' },
            { label: 'Home-based business rules', action: '/chat?prompt=home+occupation' },
            { label: 'Food truck regulations', action: '/chat?prompt=food+truck' }
          ].map((q, i) => (
            <Link
              key={i}
              href={q.action}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
            >
              <span>•</span>
              <span>{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div>
        <h2 className="font-bold mb-4">Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'License Wizard', icon: '📋', path: '/tools/license-wizard' },
            { label: 'Sign Permit', icon: '🪧', path: '/tools/sign-permit' },
            { label: 'Home Occupation', icon: '🏠', path: '/tools/home-occupation' },
            { label: 'Location Check', icon: '📍', path: '/lookup' }
          ].map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow text-center">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold text-sm">{tool.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Legal / Title Dashboard
function LegalDashboard({ data, savedProperties, onLookup, lookupLoading, lookupAddress, setLookupAddress, usageData }: {
  data: DashboardData | null;
  savedProperties: SavedProperty[];
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  lookupAddress: string;
  setLookupAddress: (val: string) => void;
  usageData: UsageData | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-xl font-bold">Title & Legal Pro</h1>
              <p className="text-gray-500">{data?.companyName || 'Property compliance lookup'}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Plan: <span className="capitalize">{usageData?.plan || 'Business'}</span></div>
        </div>
      </div>

      {/* Usage Stats */}
      {usageData && (
        <UsageStats
          lookups={usageData.lookups}
          savedProperties={usageData.savedProperties}
          plan={usageData.plan}
        />
      )}

      {/* Search Fields */}
      <div className="card space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span>📍</span>
            <span className="font-medium">Property Search</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="Enter address..."
              value={lookupAddress}
              onChange={(e) => setLookupAddress(e.target.value)}
            />
            <button className="button" onClick={() => router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}>
              Go
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span>📁</span>
            <span className="font-medium">File/Case #</span>
          </div>
          <div className="flex gap-2">
            <input type="text" className="input flex-1" placeholder="Enter file number..." />
            <button className="button">Go</button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <h2 className="font-bold mb-4">Recent Reports</h2>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">File #</th>
              <th className="pb-2">Address</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Report</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-3">TC-001</td>
              <td className="py-3">123 Main St</td>
              <td className="py-3"><span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Clear</span></td>
              <td className="py-3 space-x-2">
                <button className="text-blue-600 text-sm">PDF</button>
                <button className="text-blue-600 text-sm">Share</button>
              </td>
            </tr>
            <tr className="border-b">
              <td className="py-3">TC-002</td>
              <td className="py-3">456 Oak Ave</td>
              <td className="py-3"><span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">1 Permit</span></td>
              <td className="py-3 space-x-2">
                <button className="text-blue-600 text-sm">PDF</button>
                <button className="text-blue-600 text-sm">Share</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Generate Tools */}
      <div>
        <h2 className="font-bold mb-4">Generate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Compliance Certificate', icon: '📜', path: '/tools/compliance-cert' },
            { label: 'Permit History', icon: '📋', path: '/tools/permit-history' },
            { label: 'Zoning Letter', icon: '✉️', path: '/tools/zoning-letter' },
            { label: 'Municipal Code', icon: '⚖️', path: '/ordinances' }
          ].map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow text-center">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold text-sm">{tool.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Developer Dashboard
function DeveloperDashboard({ data, savedProperties, onLookup, lookupLoading, lookupAddress, setLookupAddress, usageData }: {
  data: DashboardData | null;
  savedProperties: SavedProperty[];
  onLookup: (address: string) => void;
  lookupLoading: boolean;
  lookupAddress: string;
  setLookupAddress: (val: string) => void;
  usageData: UsageData | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏗️</span>
            <div>
              <h1 className="text-xl font-bold">Developer</h1>
              <p className="text-gray-500">{data?.companyName || 'Site analysis and feasibility'}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">Plan: <span className="capitalize">{usageData?.plan || 'Business'}</span></div>
        </div>
      </div>

      {/* Usage Stats */}
      {usageData && (
        <UsageStats
          lookups={usageData.lookups}
          savedProperties={usageData.savedProperties}
          plan={usageData.plan}
        />
      )}

      {/* Site Analysis */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📍</span>
          <h2 className="font-bold">Site Analysis</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Enter site address..."
            value={lookupAddress}
            onChange={(e) => setLookupAddress(e.target.value)}
          />
          <button className="button" onClick={() => router.push(`/lookup?address=${encodeURIComponent(lookupAddress)}`)}>
            Go
          </button>
        </div>
      </div>

      {/* My Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">My Projects</h2>
          <button className="button-secondary text-sm">+ Add New</button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-2">Site</th>
              <th className="pb-2">Zone</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {savedProperties.map((prop) => (
              <tr key={prop.id} className="border-b last:border-0">
                <td className="py-3">{prop.address}</td>
                <td className="py-3">{prop.zoneCode || 'N/A'}</td>
                <td className="py-3">
                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">In review</span>
                </td>
                <td className="py-3 space-x-2">
                  <button className="text-blue-600 text-sm">View</button>
                  <button className="text-blue-600 text-sm">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tools */}
      <div>
        <h2 className="font-bold mb-4">Tools</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Feasibility Report', icon: '📊', path: '/tools/feasibility' },
            { label: 'Entitlement Pathway', icon: '🗺️', path: '/tools/entitlements' },
            { label: 'Zone Change History', icon: '📋', path: '/tools/zone-history' },
            { label: 'Public Meetings', icon: '🏛️', path: '/tools/meetings' }
          ].map((tool, i) => (
            <Link key={i} href={tool.path} className="card hover:shadow-lg transition-shadow text-center">
              <div className="text-2xl mb-2">{tool.icon}</div>
              <div className="font-semibold text-sm">{tool.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
