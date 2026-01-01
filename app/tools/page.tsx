'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type UserType = 'homeowner' | 'contractor' | 'realtor' | 'title' | 'legal' | 'developer' | 'small_business';

interface Tool {
  label: string;
  path: string;
  icon: string;
  description: string;
}

const TOOLS_BY_TYPE: Record<UserType, Tool[]> = {
  homeowner: [
    { label: 'Permit Checker', path: '/tools/permit-checker', icon: '📋', description: 'See if your project needs a permit' },
    { label: 'Fence Calculator', path: '/tools/fence', icon: '🏗️', description: 'Check fence height and setback rules' },
    { label: 'Noise Rules', path: '/tools/noise', icon: '🔊', description: 'Quiet hours and noise limits' },
    { label: 'Trash Schedule', path: '/tools/trash', icon: '🗑️', description: 'Pickup days and recycling info' },
    { label: 'My Representatives', path: '/tools/reps', icon: '🏛️', description: 'Find your elected officials' },
    { label: 'Report an Issue', path: '/tools/report', icon: '📢', description: 'Submit a service request' }
  ],
  contractor: [
    { label: 'Permit Checker', path: '/tools/permit-checker', icon: '📋', description: 'Check permit requirements by project type' },
    { label: 'Compliance Calculator', path: '/tools/compliance', icon: '✅', description: 'Upload site plan for instant compliance check' },
    { label: 'Fee Estimator', path: '/tools/fees', icon: '💰', description: 'Estimate permit fees by valuation' },
    { label: 'Form Library', path: '/tools/forms', icon: '📄', description: 'Download permit applications' },
    { label: 'Bulk Lookup', path: '/tools/bulk', icon: '📊', description: 'Check multiple addresses at once' },
    { label: 'Inspection Scheduler', path: '/tools/inspections', icon: '📅', description: 'Schedule and track inspections' }
  ],
  realtor: [
    { label: 'Zoning Report', path: '/tools/zoning-report', icon: '📋', description: 'Generate PDF zoning report' },
    { label: 'Development Potential', path: '/tools/dev-potential', icon: '📈', description: 'Analyze what can be built' },
    { label: 'Site Finder', path: '/tools/site-finder', icon: '🗺️', description: 'Search properties by zone type' },
    { label: 'Client Reports', path: '/tools/client-reports', icon: '📤', description: 'Share branded reports' },
    { label: 'Comp Analysis', path: '/tools/comps', icon: '📊', description: 'Zoning comparison for nearby properties' },
    { label: 'School Districts', path: '/tools/schools', icon: '🏫', description: 'School zone lookup' }
  ],
  small_business: [
    { label: 'License Wizard', path: '/tools/license-wizard', icon: '📋', description: 'Find what licenses you need' },
    { label: 'Sign Permit Check', path: '/tools/sign-permit', icon: '🪧', description: 'Sign size and placement rules' },
    { label: 'Home Occupation', path: '/tools/home-occupation', icon: '🏠', description: 'Rules for home-based business' },
    { label: 'Food Service', path: '/tools/food-service', icon: '🍽️', description: 'Restaurant and food truck permits' },
    { label: 'Location Check', path: '/lookup', icon: '📍', description: 'Can your business go here?' },
    { label: 'Parking Requirements', path: '/tools/parking', icon: '🅿️', description: 'Commercial parking rules' }
  ],
  legal: [
    { label: 'Compliance Certificate', path: '/tools/compliance-cert', icon: '📜', description: 'Generate formal compliance report' },
    { label: 'Permit History', path: '/tools/permit-history', icon: '📋', description: 'Full permit history for property' },
    { label: 'Violation Check', path: '/tools/violations', icon: '⚠️', description: 'Check for open violations' },
    { label: 'Zoning Letter', path: '/tools/zoning-letter', icon: '✉️', description: 'Request zoning confirmation' },
    { label: 'Municipal Code', path: '/ordinances', icon: '⚖️', description: 'Search with citations' },
    { label: 'Variance History', path: '/tools/variances', icon: '📁', description: 'Past variance decisions' }
  ],
  title: [
    { label: 'Compliance Certificate', path: '/tools/compliance-cert', icon: '📜', description: 'Generate for closing' },
    { label: 'Permit History', path: '/tools/permit-history', icon: '📋', description: 'All permits and status' },
    { label: 'Violation Check', path: '/tools/violations', icon: '⚠️', description: 'Open violations' },
    { label: 'Lien Search', path: '/tools/liens', icon: '🔍', description: 'Municipal lien status' },
    { label: 'Zoning Letter', path: '/tools/zoning-letter', icon: '✉️', description: 'Zoning confirmation letter' },
    { label: 'Certificate of Occupancy', path: '/tools/co-search', icon: '🏢', description: 'CO status and history' }
  ],
  developer: [
    { label: 'Feasibility Report', path: '/tools/feasibility', icon: '📊', description: 'Development potential analysis' },
    { label: 'Entitlement Pathway', path: '/tools/entitlements', icon: '🗺️', description: 'What approvals are needed' },
    { label: 'Zone Change History', path: '/tools/zone-history', icon: '📋', description: 'Recent rezoning in area' },
    { label: 'Bulk Site Analysis', path: '/tools/bulk', icon: '📊', description: 'Analyze multiple parcels' },
    { label: 'Public Meetings', path: '/tools/meetings', icon: '🏛️', description: 'Upcoming planning meetings' },
    { label: 'Impact Fees', path: '/tools/impact-fees', icon: '💰', description: 'Estimate development fees' }
  ]
};

export default function ToolsPage() {
  const [userType, setUserType] = useState<UserType>('homeowner');

  useEffect(() => {
    const storedType = localStorage.getItem('civix_userType') as UserType;
    if (storedType && TOOLS_BY_TYPE[storedType]) {
      setUserType(storedType);
    }
  }, []);

  const tools = TOOLS_BY_TYPE[userType] || TOOLS_BY_TYPE.homeowner;

  const getUserTypeLabel = (type: UserType): string => {
    const labels: Record<UserType, string> = {
      homeowner: 'Homeowner',
      contractor: 'Contractor',
      realtor: 'Real Estate',
      small_business: 'Small Business',
      legal: 'Legal',
      title: 'Title & Escrow',
      developer: 'Developer'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛠️</span>
            <h1 className="text-xl font-bold">Tools</h1>
          </div>
          <div className="text-sm text-gray-500">
            Showing tools for: <span className="font-medium">{getUserTypeLabel(userType)}</span>
            <Link href="/settings" className="ml-2 text-blue-600 hover:underline">
              Change
            </Link>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool, i) => (
          <Link
            key={i}
            href={tool.path}
            className="card hover:shadow-lg hover:border-blue-500 border-2 border-transparent transition-all"
          >
            <div className="text-3xl mb-3">{tool.icon}</div>
            <h3 className="font-bold mb-1">{tool.label}</h3>
            <p className="text-sm text-gray-500">{tool.description}</p>
          </Link>
        ))}
      </div>

      {/* All Tools Section */}
      <div className="card">
        <h2 className="font-bold mb-4">Browse All Tools</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOOLS_BY_TYPE).map(([type, typeTools]) => (
            <div key={type} className="mb-4 w-full">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {getUserTypeLabel(type as UserType)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {typeTools.map((tool, i) => (
                  <Link
                    key={i}
                    href={tool.path}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200"
                  >
                    {tool.icon} {tool.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
