'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExtractionJob {
  id: string;
  jurisdictionId: string;
  jobType: string;
  status: string;
  progress: number;
  itemsFound: number;
  itemsNeedReview: number;
  confidenceScore: number | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  _count: {
    items: number;
  };
}

export default function ExtractionsPage() {
  const [jobs, setJobs] = useState<ExtractionJob[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newJurisdictionId, setNewJurisdictionId] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const fetchJobs = async () => {
    const url =
      filter === 'all'
        ? '/api/admin/extractions'
        : `/api/admin/extractions?status=${filter}`;

    const res = await fetch(url);
    const data = await res.json();
    setJobs(data.jobs || []);
    setLoading(false);
  };

  const startExtraction = async () => {
    if (!newJurisdictionId.trim()) return;

    try {
      const res = await fetch('/api/admin/extractions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jurisdictionId: newJurisdictionId.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        setNewJurisdictionId('');
        fetchJobs();
        alert(`Extraction started! Job ID: ${data.jobId}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Failed to start extraction');
    }
  };

  const approveJob = async (jobId: string) => {
    if (!confirm('Approve this extraction and import to production?')) return;

    try {
      const res = await fetch(`/api/admin/extractions/${jobId}/approve`, {
        method: 'POST',
      });

      const data = await res.json();
      if (data.success) {
        fetchJobs();
        alert('Extraction approved and imported!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Failed to approve extraction');
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Extraction Jobs</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
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
          New Extraction
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'extracting', 'review', 'approved', 'failed'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
              px-4 py-2 rounded-lg transition-colors
              ${filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
            `}
            >
              {status === 'all'
                ? 'All'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jurisdiction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  No extraction jobs found
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-600">
                      {job.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {job.jurisdictionId}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">
                        {job.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">{job.itemsFound} found</div>
                      {job.itemsNeedReview > 0 && (
                        <div className="text-yellow-600">
                          {job.itemsNeedReview} need review
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {job.confidenceScore !== null ? (
                      <div className="flex items-center gap-2">
                        <ConfidenceIndicator score={job.confidenceScore} />
                        <span className="text-sm text-gray-600">
                          {Math.round(job.confidenceScore * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/extractions/${job.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                      {job.status === 'review' && (
                        <button
                          onClick={() => approveJob(job.id)}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Extraction Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Start New Extraction
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jurisdiction ID
              </label>
              <input
                type="text"
                value={newJurisdictionId}
                onChange={(e) => setNewJurisdictionId(e.target.value)}
                placeholder="e.g., cincinnati-oh"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: city-name-state (e.g., mason-oh, covington-ky)
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={startExtraction}
                disabled={!newJurisdictionId.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Extraction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

function ConfidenceIndicator({ score }: { score: number }) {
  const color =
    score >= 0.8 ? 'bg-green-500' : score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500';

  return <div className={`w-3 h-3 rounded-full ${color}`} />;
}
