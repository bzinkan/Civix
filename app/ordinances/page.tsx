'use client';

import { useState } from 'react';
import { LocationInput, LocationData } from '@/components/location-input';

interface Jurisdiction {
  id: string;
  name: string;
  state: string;
  type: string;
  hasOrdinances: boolean;
  ordinanceCount: number;
}

interface OrdinanceSource {
  citation: string;
  title: string;
  chapter: string;
  section: string | null;
  similarity: number;
  url: string | null;
}

export default function OrdinancesPage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<OrdinanceSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = async (newLocation: LocationData | null) => {
    setLocation(newLocation);
    setJurisdiction(null);
    setAnswer(null);
    setSources([]);
    setError(null);

    if (!newLocation) return;

    // Look up jurisdiction
    try {
      const response = await fetch(
        `/api/jurisdictions/lookup?city=${encodeURIComponent(newLocation.city)}&state=${encodeURIComponent(newLocation.state)}`
      );

      const data = await response.json();

      if (data.found) {
        setJurisdiction(data.jurisdiction);
      } else {
        setError(data.message + ' ' + (data.suggestion || ''));
      }
    } catch (err: any) {
      setError('Failed to lookup jurisdiction');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !jurisdiction) return;

    setIsLoading(true);
    setError(null);
    setAnswer(null);
    setSources([]);

    try {
      const response = await fetch('/api/ordinances/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          jurisdictionId: jurisdiction.id,
          topK: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      setAnswer(data.answer);
      setSources(data.sources || []);

    } catch (err: any) {
      setError(err.message || 'Failed to process question');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ordinance Assistant
          </h1>
          <p className="text-gray-600">
            Ask questions about local ordinances and regulations
          </p>
        </div>

        {/* Step 1: Location Input */}
        <LocationInput
          onLocationChange={handleLocationChange}
          className="mb-6"
        />

        {/* Step 2: Jurisdiction Confirmation */}
        {jurisdiction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-green-900">
                {jurisdiction.name}, {jurisdiction.state}
              </h3>
            </div>
            <p className="text-sm text-green-700">
              {jurisdiction.ordinanceCount.toLocaleString()} ordinance sections available
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step 3: Question Input */}
        {jurisdiction && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Ask a Question</h3>
            <form onSubmit={handleAskQuestion} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to know?
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Example: Are pitbulls allowed? Can I build a fence? What are the noise ordinances?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Searching ordinances...' : 'Get Answer'}
              </button>
            </form>
          </div>
        )}

        {/* Step 4: Answer Display */}
        {answer && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Answer</h3>
            <div className="prose prose-sm max-w-none mb-6">
              <p className="whitespace-pre-wrap text-gray-800">{answer}</p>
            </div>

            {sources.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Sources ({sources.length})
                </h4>
                <div className="space-y-3">
                  {sources.map((source, i) => (
                    <div key={i} className="bg-gray-50 rounded-md p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900">
                          {source.citation}
                        </p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {source.similarity}% match
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{source.title}</p>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          View source →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example Questions */}
        {jurisdiction && !answer && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Example Questions
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Are pitbulls allowed in {jurisdiction.name}?</li>
              <li>• Can I build a fence? What are the height requirements?</li>
              <li>• What are the noise ordinances?</li>
              <li>• Can I raise chickens in my backyard?</li>
              <li>• What are the short-term rental regulations?</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
