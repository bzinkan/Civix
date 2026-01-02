'use client';

import { useState, useEffect } from 'react';

interface WaitlistEntry {
  id: string;
  email: string;
  jurisdictionId: string | null;
  cityName: string | null;
  stateCode: string | null;
  addressSearched: string | null;
  source: string;
  createdAt: string;
  notifiedAt: string | null;
}

interface WaitlistStats {
  jurisdictionId: string;
  cityName: string;
  stateCode: string;
  count: number;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'stats'>('stats');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // In a real implementation, create API endpoints for this
    // For now, we'll simulate with placeholder data
    setLoading(false);
    setStats([
      { jurisdictionId: 'columbus-oh', cityName: 'Columbus', stateCode: 'OH', count: 45 },
      { jurisdictionId: 'cleveland-oh', cityName: 'Cleveland', stateCode: 'OH', count: 32 },
      { jurisdictionId: 'dayton-oh', cityName: 'Dayton', stateCode: 'OH', count: 28 },
      { jurisdictionId: 'lexington-ky', cityName: 'Lexington', stateCode: 'KY', count: 21 },
      { jurisdictionId: 'toledo-oh', cityName: 'Toledo', stateCode: 'OH', count: 15 },
    ]);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Waitlist</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView('stats')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By City
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Entries
          </button>
        </div>
      </div>

      {view === 'stats' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Signups
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.map((stat, index) => (
                <tr key={stat.jurisdictionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`
                      inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                      ${index === 0
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                            ? 'bg-gray-100 text-gray-700'
                            : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-50 text-gray-600'}
                    `}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {stat.cityName}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{stat.stateCode}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(stat.count / stats[0].count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium text-gray-900">
                        {stat.count}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-green-600 hover:underline text-sm">
                      Start Extraction
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            <p>Waitlist entries will appear here once the API is connected.</p>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-blue-600">
            {stats.reduce((sum, s) => sum + s.count, 0)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Total Signups</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-green-600">
            {stats.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">Cities Requested</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-3xl font-bold text-purple-600">
            {stats[0]?.cityName || 'N/A'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Most Requested</div>
        </div>
      </div>
    </div>
  );
}
