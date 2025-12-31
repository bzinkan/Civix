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
        <h2 className="text-3xl font-bold text-center mb-8">How would you like to get started?</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* AI Chat Card */}
          <Link href="/ask" className="group">
            <div className="card hover:shadow-xl transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-blue-500">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-2xl font-bold mb-3">Ask AI Assistant</h3>
              <p className="text-gray-600 mb-4">
                Have a conversation with our AI. Just describe your situation in plain English
                and get personalized guidance.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>✓ Natural language conversation</li>
                <li>✓ AI extracts key information</li>
                <li>✓ 3 free queries to try it out</li>
              </ul>
              <div className="text-blue-600 font-semibold group-hover:underline">
                Start chatting →
              </div>
            </div>
          </Link>

          {/* Guided Form Card */}
          <Link href="/dashboard" className="group">
            <div className="card hover:shadow-xl transition-shadow cursor-pointer h-full border-2 border-transparent hover:border-blue-500">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-2xl font-bold mb-3">Guided Questionnaire</h3>
              <p className="text-gray-600 mb-4">
                Answer step-by-step questions to get a precise compliance determination
                based on your specific situation.
              </p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>✓ Structured question flow</li>
                <li>✓ Clear, predictable process</li>
                <li>✓ Detailed compliance results</li>
              </ul>
              <div className="text-blue-600 font-semibold group-hover:underline">
                Start questionnaire →
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
            <h3 className="font-semibold mb-2">Choose Your Path</h3>
            <p className="text-sm text-gray-700">AI chat for exploration or guided form for precision</p>
          </div>
          <div>
            <div className="text-3xl mb-3">2️⃣</div>
            <h3 className="font-semibold mb-2">Answer Questions</h3>
            <p className="text-sm text-gray-700">Provide details about your specific situation</p>
          </div>
          <div>
            <div className="text-3xl mb-3">3️⃣</div>
            <h3 className="font-semibold mb-2">Get Results</h3>
            <p className="text-sm text-gray-700">Instant compliance determination with citations</p>
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
