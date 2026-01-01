'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  hasLiquor: boolean;
  seatingCapacity: string;
  hasOutdoorSeating: boolean;
  cuisineType: string;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

export default function RestaurantWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    hasLiquor: false,
    seatingCapacity: '',
    hasOutdoorSeating: false,
    cuisineType: ''
  });

  const updateData = (field: keyof WizardData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);

    // Store in localStorage
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'restaurant');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    // Try to save to server
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'restaurant',
          foodBusinessData: data
        })
      });
    } catch {
      // Ignore errors
    }

    router.push('/dashboard');
  };

  const totalSteps = 3;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍳</div>
          <h1 className="text-3xl font-bold mb-2">Restaurant Setup</h1>
          <p className="text-gray-600">Let's get you started with the right permits</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name (optional)
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Joe's Diner"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Where are you in the process?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => updateData('stage', stage.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      data.stage === stage.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{stage.label}</div>
                    <div className="text-sm text-gray-500">{stage.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link
                href="/onboarding/food"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </Link>
              <button
                className="button"
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Size */}
        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Location & Size</h2>

            {data.stage !== 'planning' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address (if known)
                </label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="e.g., 123 Main St, Cincinnati, OH"
                  value={data.address}
                  onChange={(e) => updateData('address', e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Estimated seating capacity
              </label>
              <select
                className="input w-full"
                value={data.seatingCapacity}
                onChange={(e) => updateData('seatingCapacity', e.target.value)}
              >
                <option value="">Select capacity...</option>
                <option value="under_15">Under 15 seats</option>
                <option value="15_50">15-50 seats</option>
                <option value="50_100">50-100 seats</option>
                <option value="100_plus">100+ seats</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Affects restroom requirements and occupancy permits
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="outdoor"
                checked={data.hasOutdoorSeating}
                onChange={(e) => updateData('hasOutdoorSeating', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="outdoor">
                Planning outdoor seating or patio?
              </label>
            </div>

            <div className="flex justify-between pt-4">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                className="button"
                onClick={() => setStep(3)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Licenses & Type */}
        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Licenses & Type</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Type of cuisine (optional)
              </label>
              <select
                className="input w-full"
                value={data.cuisineType}
                onChange={(e) => updateData('cuisineType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="full_service">Full-service restaurant</option>
                <option value="fast_casual">Fast casual</option>
                <option value="qsr">Quick service (QSR/fast food)</option>
                <option value="cafe">Cafe / Coffee shop</option>
                <option value="bakery">Bakery</option>
                <option value="deli">Deli / Sandwich shop</option>
                <option value="pizza">Pizza</option>
                <option value="sushi">Sushi / Raw bar</option>
                <option value="other">Other</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                High-risk foods (sushi, raw bar) require Type 4 food license
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="liquor"
                checked={data.hasLiquor}
                onChange={(e) => updateData('hasLiquor', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="liquor">
                Planning to serve alcohol?
              </label>
            </div>
            {data.hasLiquor && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <strong>Note:</strong> Liquor licenses in Ohio require state (DOLC) and local approval.
                Process takes 60-90 days. We'll include this in your checklist.
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                className="button"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Setting up...' : 'Complete Setup →'}
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <strong>What happens next?</strong>
          <ul className="mt-2 space-y-1">
            <li>• We'll create a personalized permit checklist</li>
            <li>• Show you zoning requirements for your location</li>
            <li>• Estimate fees and timeline</li>
            <li>• Connect you with relevant forms and contacts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
