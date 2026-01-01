import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageStats } from '../../../../lib/checkPlanLimits';

/**
 * GET /api/user/usage
 *
 * Returns user's current usage stats for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      // Return anonymous/demo stats
      return NextResponse.json({
        plan: 'free',
        lookups: {
          used: 0,
          limit: 5,
          unlimited: false,
          resetDate: null,
        },
        savedProperties: {
          used: 0,
          limit: 1,
          unlimited: false,
        },
        reports: {
          used: 0,
          limit: 0,
          unlimited: false,
        },
        features: {
          docUpload: false,
          pdfReports: false,
          bulkLookup: false,
          apiAccess: false,
        },
      });
    }

    const usage = await getUserUsageStats(userId);

    if (!usage) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(usage);

  } catch (error: unknown) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}
