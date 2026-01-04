'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">About Civix</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Chat
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Hero */}
          <div className="mb-10">
            <p className="text-xl text-gray-700 leading-relaxed">
              Civix helps you understand what's allowed at a location — and why.
            </p>
            <p className="text-gray-600 mt-4">
              It combines property data, local rules, and clear explanations so you can make
              informed decisions without digging through zoning codes, ordinances, or agency websites.
            </p>
            <p className="text-gray-600 mt-2">
              You ask questions in plain language. Civix explains how the rules apply.
            </p>
          </div>

          {/* What Civix Does Well */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">What Civix Does Well</h2>
            <p className="text-gray-600 mb-3">Civix is designed for questions like:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Is this allowed at this property?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>What rules apply here?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Why is something restricted in one place but allowed in another?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Where can I do X with the fewest restrictions?</span>
              </li>
            </ul>
            <p className="text-gray-600 mt-4">
              It works best when you provide an address, but can also give general guidance
              based on a city, county, or region.
            </p>
          </section>

          {/* How It Works */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">Civix identifies the location</p>
                  <p className="text-gray-600 text-sm">Jurisdiction, zoning, and other factors that affect what's allowed.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">You ask in plain language</p>
                  <p className="text-gray-600 text-sm">No forms, no jargon required.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-800">Civix explains the result</p>
                  <p className="text-gray-600 text-sm">With reasoning and source references when available.</p>
                </div>
              </div>
            </div>
          </section>

          {/* What Civix Is Not */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">What Civix Is Not</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✕</span>
                  <span>Not legal advice</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✕</span>
                  <span>Not a permit or approval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">✕</span>
                  <span>Not a replacement for local officials or professional consultants</span>
                </li>
              </ul>
              <p className="text-gray-600 mt-3 text-sm">
                Local rules are complex. Final decisions are always made by the governing authority.
              </p>
            </div>
          </section>

          {/* Coverage */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Coverage</h2>
            <p className="text-gray-600 mb-3">
              Civix currently focuses on the <span className="font-medium">Cincinnati metro area</span>:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700 mb-1">Ohio</p>
                <ul className="text-gray-600 space-y-0.5">
                  <li>Hamilton County</li>
                  <li>Butler County</li>
                  <li>Warren County</li>
                  <li>Clermont County</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Kentucky</p>
                <ul className="text-gray-600 space-y-0.5">
                  <li>Boone County</li>
                  <li>Kenton County</li>
                  <li>Campbell County</li>
                </ul>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-4">More regions coming soon.</p>
          </section>

          {/* Data & Accuracy */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Data & Accuracy</h2>
            <p className="text-gray-600">
              Civix uses publicly available data and official sources where possible.
              Rules change, interpretations vary, and some situations require human review.
            </p>
            <p className="text-gray-600 mt-2">
              Civix explains its assumptions and cites sources so you can verify.
            </p>
          </section>

          {/* Who It's For */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Who It's For</h2>
            <p className="text-gray-600">
              Homeowners, renters, business owners, developers, consultants — anyone navigating
              local rules who wants a faster starting point.
            </p>
          </section>

          {/* Contact */}
          <section className="border-t border-gray-200 pt-8">
            <p className="text-gray-600">
              <span className="font-medium">Questions?</span>{' '}
              <a href="mailto:support@civix.app" className="text-blue-600 hover:text-blue-700">
                support@civix.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
