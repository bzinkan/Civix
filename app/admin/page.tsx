import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [
    jurisdictionStats,
    extractionStats,
    userCount,
    waitlistCount,
    recentJobs,
    recentActivity,
  ] = await Promise.all([
    prisma.jurisdiction.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.extractionJob.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.user.count(),
    prisma.waitlist.count(),
    prisma.extractionJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.adminActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const liveCount =
    jurisdictionStats.find((s) => s.status === 'live')?._count || 0;
  const pendingReview =
    extractionStats.find((s) => s.status === 'review')?._count || 0;
  const inProgress =
    extractionStats.find((s) => s.status === 'extracting')?._count || 0;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Live Jurisdictions"
          value={liveCount}
          color="green"
          href="/admin/jurisdictions?status=live"
        />
        <StatCard
          title="Pending Review"
          value={pendingReview}
          color="yellow"
          href="/admin/extractions?status=review"
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          color="blue"
          href="/admin/extractions?status=extracting"
        />
        <StatCard
          title="Waitlist Signups"
          value={waitlistCount}
          color="purple"
          href="/admin/waitlist"
        />
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Recent Extractions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Extractions
            </h2>
            <Link
              href="/admin/extractions"
              className="text-blue-600 hover:underline text-sm"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No extraction jobs yet</p>
            ) : (
              recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.jurisdictionId}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/admin/jurisdictions/new"
              className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Add Jurisdiction</p>
                <p className="text-sm text-gray-500">Add a new city to track</p>
              </div>
            </Link>

            <Link
              href="/admin/extractions?action=new"
              className="flex items-center gap-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Start Extraction</p>
                <p className="text-sm text-gray-500">
                  Run AI extraction on a city
                </p>
              </div>
            </Link>

            <Link
              href="/admin/extractions?status=review"
              className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Queue</p>
                <p className="text-sm text-gray-500">
                  {pendingReview} extractions awaiting review
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No activity yet</p>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <ActivityIcon action={activity.action} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}</span>
                      {activity.targetId && (
                        <span className="text-gray-500">
                          {' '}
                          on {activity.targetType}: {activity.targetId}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
  href,
}: {
  title: string;
  value: number;
  color: 'green' | 'yellow' | 'blue' | 'purple';
  href: string;
}) {
  const colors = {
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <Link href={href} className="block">
      <div
        className={`${colors[color]} rounded-lg p-6 border hover:shadow-md transition-shadow`}
      >
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-75 mt-1">{title}</div>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    scraping: 'bg-blue-100 text-blue-700',
    extracting: 'bg-blue-100 text-blue-700',
    review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {status}
    </span>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('extraction')) {
    return (
      <svg
        className="w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    );
  }

  if (action.includes('jurisdiction')) {
    return (
      <svg
        className="w-4 h-4 text-gray-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
