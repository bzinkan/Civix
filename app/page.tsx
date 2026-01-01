'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if user has already onboarded
    const userType = localStorage.getItem('civix_userType');
    if (userType) {
      router.push('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  // Show loading while checking
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Civix Compliance Intelligence</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Navigate regulatory compliance with confidence. Get instant answers to permits,
          zoning, and local regulations for any property.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/onboarding" className="button text-lg px-8 py-3">
            Get Started
          </Link>
          <Link href="/lookup" className="button-secondary text-lg px-8 py-3">
            Try a Lookup
          </Link>
        </div>
      </section>

      {/* User Types Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Built for Everyone</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold mb-2">Homeowners</h3>
            <p className="text-gray-600">
              Check permits, find your trash day, understand what you can build
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🔨</div>
            <h3 className="text-xl font-bold mb-2">Contractors</h3>
            <p className="text-gray-600">
              Quick compliance checks, fee estimates, bulk property lookups
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-2">Real Estate Pros</h3>
            <p className="text-gray-600">
              Zoning reports, development potential, client-ready documents
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="card bg-blue-50 mb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-3">1️⃣</div>
            <h3 className="font-semibold mb-2">Enter an Address</h3>
            <p className="text-sm text-gray-700">Any property in supported jurisdictions</p>
          </div>
          <div>
            <div className="text-3xl mb-3">2️⃣</div>
            <h3 className="font-semibold mb-2">Get Instant Info</h3>
            <p className="text-sm text-gray-700">Zoning, overlays, permits, and more</p>
          </div>
          <div>
            <div className="text-3xl mb-3">3️⃣</div>
            <h3 className="font-semibold mb-2">Ask Questions</h3>
            <p className="text-sm text-gray-700">AI-powered answers with citations</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Powerful Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🔍</div>
              <div>
                <h3 className="font-bold mb-1">Property Lookup</h3>
                <p className="text-gray-600">
                  Instantly get zoning, overlays, historic status, and development standards
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📄</div>
              <div>
                <h3 className="font-bold mb-1">Document Upload</h3>
                <p className="text-gray-600">
                  Upload site plans and get AI-powered compliance checks
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💬</div>
              <div>
                <h3 className="font-bold mb-1">AI Chat</h3>
                <p className="text-gray-600">
                  Ask questions about permits, regulations, and requirements
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="font-bold mb-1">Reports & Exports</h3>
                <p className="text-gray-600">
                  Generate professional reports for clients and stakeholders
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of professionals using Civix for compliance
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </section>
    </div>
  );
}
