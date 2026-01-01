import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, User, SavedProperty, GeneratedReport } from '@prisma/client';

const prisma = new PrismaClient();

type UserType = 'homeowner' | 'contractor' | 'realtor' | 'title' | 'legal' | 'developer' | 'small_business';

// User with relations included
type UserWithRelations = User & {
  savedProperties: SavedProperty[];
  generatedReports: GeneratedReport[];
};

/**
 * Role-Based Dashboard API
 *
 * GET /api/user/dashboard
 *
 * Returns personalized dashboard data based on user type
 */

interface DashboardWidget {
  id: string;
  title: string;
  type: 'quick_action' | 'stat' | 'list' | 'tool';
  icon?: string;
  action?: string;
  data?: unknown;
}

interface DashboardConfig {
  greeting: string;
  widgets: DashboardWidget[];
  quickActions: Array<{ label: string; action: string; icon: string }>;
  tools: Array<{ label: string; path: string; icon: string; description: string }>;
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    // Allow anonymous/demo dashboard
    let user: UserWithRelations | null = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          savedProperties: {
            orderBy: { updatedAt: 'desc' },
            take: 10
          },
          generatedReports: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });
    }

    const userType = (user?.userType || 'homeowner') as UserType;
    const dashboard = buildDashboard(userType, user);

    return NextResponse.json({
      userType,
      userName: user?.name || 'Guest',
      companyName: user?.companyName,
      plan: user?.subscriptionPlan || 'free',
      dashboard
    });

  } catch (error: unknown) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

function buildDashboard(userType: UserType, user: UserWithRelations | null): DashboardConfig {
  const configs: Record<string, DashboardConfig> = {
    homeowner: {
      greeting: 'What can we help you with today?',
      widgets: [
        {
          id: 'my_property',
          title: 'My Property',
          type: 'stat',
          data: user?.savedProperties?.[0] || null
        }
      ],
      quickActions: [
        { label: 'Do I need a permit?', action: '/chat?prompt=permit', icon: '🔨' },
        { label: 'What can I build?', action: '/chat?prompt=build', icon: '🏗️' },
        { label: 'Trash & recycling', action: '/lookup/trash', icon: '🗑️' },
        { label: 'Report an issue', action: '/report', icon: '📢' },
        { label: 'My representatives', action: '/representatives', icon: '🏛️' }
      ],
      tools: [
        { label: 'Permit Checker', path: '/tools/permit-check', icon: '📋', description: 'See if your project needs a permit' },
        { label: 'Fence Calculator', path: '/tools/fence', icon: '🏗️', description: 'Check fence height rules' },
        { label: 'Noise Rules', path: '/civics/noise', icon: '🔊', description: 'Quiet hours and limits' }
      ]
    },

    contractor: {
      greeting: 'Ready to check a job site?',
      widgets: [
        {
          id: 'recent_lookups',
          title: 'Recent Lookups',
          type: 'list',
          data: user?.savedProperties?.slice(0, 5) || []
        }
      ],
      quickActions: [
        { label: 'Quick Lookup', action: '/lookup', icon: '🔍' },
        { label: 'Compliance Check', action: '/tools/compliance', icon: '✅' },
        { label: 'Fee Estimator', action: '/tools/fees', icon: '💰' },
        { label: 'Bulk Lookup', action: '/tools/bulk', icon: '📊' }
      ],
      tools: [
        { label: 'Property Lookup', path: '/lookup', icon: '📍', description: 'Check zoning, overlays, and requirements' },
        { label: 'Compliance Calculator', path: '/tools/compliance', icon: '✅', description: 'Upload site plan for instant check' },
        { label: 'Fee Estimator', path: '/tools/fees', icon: '💰', description: 'Estimate permit fees' },
        { label: 'Form Library', path: '/forms', icon: '📄', description: 'Download permit applications' },
        { label: 'Bulk Lookup', path: '/tools/bulk', icon: '📊', description: 'Check multiple addresses at once' }
      ]
    },

    realtor: {
      greeting: 'Find the perfect property',
      widgets: [
        {
          id: 'saved_properties',
          title: 'Saved Properties',
          type: 'list',
          data: user?.savedProperties || []
        },
        {
          id: 'recent_reports',
          title: 'Recent Reports',
          type: 'list',
          data: user?.generatedReports || []
        }
      ],
      quickActions: [
        { label: 'Property Lookup', action: '/lookup', icon: '🔍' },
        { label: 'Zoning Report', action: '/tools/zoning-report', icon: '📋' },
        { label: 'Find Sites by Zone', action: '/tools/site-finder', icon: '🗺️' },
        { label: 'Share with Client', action: '/share', icon: '📤' }
      ],
      tools: [
        { label: 'Property Lookup', path: '/lookup', icon: '📍', description: 'Check any address instantly' },
        { label: 'Zoning Report', path: '/tools/zoning-report', icon: '📋', description: 'Generate PDF report for clients' },
        { label: 'Development Potential', path: '/tools/dev-potential', icon: '📈', description: 'What can be built?' },
        { label: 'Site Finder', path: '/tools/site-finder', icon: '🗺️', description: 'Search by zone type' },
        { label: 'Client Sharing', path: '/share', icon: '📤', description: 'Share reports with clients' }
      ]
    },

    title: {
      greeting: 'Property compliance lookup',
      widgets: [
        {
          id: 'recent_reports',
          title: 'Recent Reports',
          type: 'list',
          data: user?.generatedReports || []
        }
      ],
      quickActions: [
        { label: 'Property Search', action: '/lookup', icon: '🔍' },
        { label: 'Compliance Certificate', action: '/tools/compliance-cert', icon: '📜' },
        { label: 'Permit History', action: '/tools/permit-history', icon: '📋' },
        { label: 'Code Search', action: '/code-search', icon: '⚖️' }
      ],
      tools: [
        { label: 'Property Search', path: '/lookup', icon: '📍', description: 'Full property analysis' },
        { label: 'Compliance Certificate', path: '/tools/compliance-cert', icon: '📜', description: 'Generate for closing' },
        { label: 'Permit History', path: '/tools/permit-history', icon: '📋', description: 'All permits and status' },
        { label: 'Violation Check', path: '/tools/violations', icon: '⚠️', description: 'Open violations' },
        { label: 'Municipal Code Search', path: '/code-search', icon: '⚖️', description: 'Search with citations' }
      ]
    },

    legal: {
      greeting: 'Municipal code research',
      widgets: [],
      quickActions: [
        { label: 'Code Search', action: '/code-search', icon: '⚖️' },
        { label: 'Property Lookup', action: '/lookup', icon: '🔍' },
        { label: 'Compliance Report', action: '/tools/compliance-cert', icon: '📜' }
      ],
      tools: [
        { label: 'Municipal Code Search', path: '/code-search', icon: '⚖️', description: 'Full-text search with citations' },
        { label: 'Property Analysis', path: '/lookup', icon: '📍', description: 'Zoning and overlay research' },
        { label: 'Compliance Certificate', path: '/tools/compliance-cert', icon: '📜', description: 'Formal compliance report' },
        { label: 'Variance History', path: '/tools/variances', icon: '📋', description: 'Past variance decisions' }
      ]
    },

    developer: {
      greeting: 'Site analysis and feasibility',
      widgets: [
        {
          id: 'saved_sites',
          title: 'Saved Sites',
          type: 'list',
          data: user?.savedProperties || []
        }
      ],
      quickActions: [
        { label: 'Site Analysis', action: '/lookup', icon: '🔍' },
        { label: 'Feasibility Report', action: '/tools/feasibility', icon: '📊' },
        { label: 'Entitlement Path', action: '/tools/entitlements', icon: '🗺️' },
        { label: 'Bulk Analysis', action: '/tools/bulk', icon: '📋' }
      ],
      tools: [
        { label: 'Site Analysis', path: '/lookup', icon: '📍', description: 'Complete zoning envelope' },
        { label: 'Feasibility Report', path: '/tools/feasibility', icon: '📊', description: 'Development potential analysis' },
        { label: 'Entitlement Pathway', path: '/tools/entitlements', icon: '🗺️', description: 'What approvals are needed' },
        { label: 'Zone Change History', path: '/tools/zone-history', icon: '📋', description: 'Recent rezoning in area' },
        { label: 'Bulk Site Analysis', path: '/tools/bulk', icon: '📊', description: 'Analyze multiple parcels' }
      ]
    },

    small_business: {
      greeting: 'Starting or running a business?',
      widgets: [],
      quickActions: [
        { label: 'License Wizard', action: '/tools/license-wizard', icon: '📋' },
        { label: 'Location Check', action: '/lookup', icon: '🔍' },
        { label: 'Sign Permit', action: '/tools/sign-permit', icon: '🪧' },
        { label: 'Home Business Rules', action: '/civics/home-occupation', icon: '🏠' }
      ],
      tools: [
        { label: 'License Wizard', path: '/tools/license-wizard', icon: '📋', description: 'What licenses do you need?' },
        { label: 'Location Compliance', path: '/lookup', icon: '📍', description: 'Can your business go here?' },
        { label: 'Sign Permit Check', path: '/tools/sign-permit', icon: '🪧', description: 'Sign size and placement rules' },
        { label: 'Home Occupation', path: '/civics/home-occupation', icon: '🏠', description: 'Rules for home-based business' },
        { label: 'Food Service', path: '/civics/food-service', icon: '🍽️', description: 'Restaurant and food truck permits' }
      ]
    }
  };

  return configs[userType] || configs.homeowner;
}
