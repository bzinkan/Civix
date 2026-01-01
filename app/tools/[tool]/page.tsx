'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

const TOOL_INFO: Record<string, { title: string; icon: string; description: string }> = {
  'permit-checker': { title: 'Permit Checker', icon: '📋', description: 'Check if your project requires a permit' },
  'compliance': { title: 'Compliance Calculator', icon: '✅', description: 'Upload a site plan for instant compliance check' },
  'fees': { title: 'Fee Estimator', icon: '💰', description: 'Estimate permit fees based on project valuation' },
  'fence': { title: 'Fence Calculator', icon: '🏗️', description: 'Check fence height and setback requirements' },
  'noise': { title: 'Noise Rules', icon: '🔊', description: 'Quiet hours and noise ordinance information' },
  'bulk': { title: 'Bulk Lookup', icon: '📊', description: 'Look up multiple addresses at once' },
  'forms': { title: 'Form Library', icon: '📄', description: 'Download permit applications and forms' },
  'zoning-report': { title: 'Zoning Report', icon: '📋', description: 'Generate a PDF zoning report' },
  'dev-potential': { title: 'Development Potential', icon: '📈', description: 'Analyze what can be built on a property' },
  'site-finder': { title: 'Site Finder', icon: '🗺️', description: 'Search for properties by zone type' },
  'license-wizard': { title: 'License Wizard', icon: '📋', description: 'Find out what licenses your business needs' },
  'sign-permit': { title: 'Sign Permit', icon: '🪧', description: 'Sign size and placement requirements' },
  'home-occupation': { title: 'Home Occupation', icon: '🏠', description: 'Rules for running a business from home' },
  'compliance-cert': { title: 'Compliance Certificate', icon: '📜', description: 'Generate a formal compliance certificate' },
  'permit-history': { title: 'Permit History', icon: '📋', description: 'View complete permit history for a property' },
  'violations': { title: 'Violation Check', icon: '⚠️', description: 'Check for open violations on a property' },
  'feasibility': { title: 'Feasibility Report', icon: '📊', description: 'Analyze development feasibility' },
  'entitlements': { title: 'Entitlement Pathway', icon: '🗺️', description: 'Determine what approvals are needed' },
  'zone-history': { title: 'Zone Change History', icon: '📋', description: 'View recent rezoning in the area' }
};

export default function ToolPage() {
  const params = useParams();
  const toolId = params.tool as string;
  const toolInfo = TOOL_INFO[toolId] || { title: 'Tool', icon: '🛠️', description: 'Coming soon' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{toolInfo.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{toolInfo.title}</h1>
            <p className="text-gray-500">{toolInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="card text-center py-16">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-gray-500 mb-6">
          This tool is under development. Check back soon!
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/tools" className="button-secondary">
            ← Back to Tools
          </Link>
          <Link href="/chat" className="button">
            Ask Civix Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
