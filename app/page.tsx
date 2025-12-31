import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4">Civix Compliance Intelligence</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Navigate regulatory compliance with confidence. Get instant answers to civic rules
          and step-by-step guidance for permits, zoning, and local regulations.
        </p>
      </section>

      {/* How to Get Started */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Get Started</h2>

        <div className="max-w-2xl mx-auto">
          {/* AI Assistant Card - Now Full Width */}
          <Link href="/ordinances" className="group">
            <div className="card hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-3">Ask About Local Ordinances</h3>
              <p className="text-gray-600 mb-4">
                Enter your location and ask questions about local regulations. Our AI searches actual ordinance text and provides answers with citations.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>✓ Search real ordinance text - no guessing</li>
                <li>✓ AI helps you find the right regulation</li>
                <li>✓ Get answers with source citations</li>
                <li>✓ 3 free queries to try it out</li>
              </ul>
              <div className="text-blue-600 font-semibold group-hover:underline">
                Start asking questions →
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Topics Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-6">Popular Compliance Topics</h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/dashboard?flow=str" className="card hover:shadow-lg transition-shadow cursor-pointer text-center">
            <div className="text-3xl mb-2">🏠</div>
            <h3 className="font-semibold">Short-Term Rentals</h3>
            <p className="text-sm text-gray-600 mt-1">Cincinnati Chapter 856</p>
          </Link>

          <div className="card bg-gray-50 text-center opacity-60">
            <div className="text-3xl mb-2">🏗️</div>
            <h3 className="font-semibold">Zoning & Property</h3>
            <p className="text-sm text-gray-600 mt-1">Coming soon</p>
          </div>

          <div className="card bg-gray-50 text-center opacity-60">
            <div className="text-3xl mb-2">🏢</div>
            <h3 className="font-semibold">Business Permits</h3>
            <p className="text-sm text-gray-600 mt-1">Coming soon</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="card bg-blue-50 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">How Civix Works</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl mb-3">1️⃣</div>
            <h3 className="font-semibold mb-2">Enter Your Location</h3>
            <p className="text-sm text-gray-700">Tell us your city or enter a full address</p>
          </div>
          <div>
            <div className="text-3xl mb-3">2️⃣</div>
            <h3 className="font-semibold mb-2">Ask Your Question</h3>
            <p className="text-sm text-gray-700">Describe what you want to know in plain English</p>
          </div>
          <div>
            <div className="text-3xl mb-3">3️⃣</div>
            <h3 className="font-semibold mb-2">Get Sourced Answers</h3>
            <p className="text-sm text-gray-700">AI finds the exact ordinance and cites the source</p>
          </div>
        </div>
      </section>

      {/* Deploy Marker */}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          right: 12,
          padding: "8px 10px",
          background: "#000",
          color: "#fff",
          borderRadius: 8,
          fontSize: 12,
          zIndex: 9999,
        }}
      >
        DEPLOY MARKER: v2-ai
      </div>
    </div>
  );
}
