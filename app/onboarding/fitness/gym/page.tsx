'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  gymType: 'full_service' | 'boutique' | '24_hour' | 'crossfit';
  squareFootage: string;
  amenities: string[];
  hasShowers: boolean;
  hasPool: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const AMENITIES = [
  'Free weights',
  'Cardio machines',
  'Weight machines',
  'Group fitness room',
  'Personal training',
  'Locker rooms',
  'Sauna/steam',
  'Juice bar'
];

export default function GymWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    gymType: 'full_service',
    squareFootage: '',
    amenities: [],
    hasShowers: false,
    hasPool: false
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'fitness_wellness');
    localStorage.setItem('civix_fitnessBusinessType', 'gym');
    localStorage.setItem('civix_fitnessBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'fitness_wellness',
          fitnessBusinessType: 'gym',
          fitnessBusinessData: data
        })
      });
    } catch {}

    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏋️</div>
          <h1 className="text-3xl font-bold mb-2">Gym / Fitness Center Setup</h1>
          <p className="text-gray-600">Get your fitness facility properly licensed</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Iron Works Fitness"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of gym</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'full_service', label: 'Full-Service Gym', desc: 'Complete fitness facility' },
                  { id: 'boutique', label: 'Boutique Studio', desc: 'Specialized fitness' },
                  { id: '24_hour', label: '24-Hour Gym', desc: 'Unmanned access' },
                  { id: 'crossfit', label: 'CrossFit/HIIT', desc: 'High-intensity training' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('gymType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.gymType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Where are you in the process?</label>
              <div className="grid grid-cols-2 gap-3">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => updateData('stage', stage.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.stage === stage.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{stage.label}</div>
                    <div className="text-sm text-gray-500">{stage.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link href="/onboarding/fitness" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Facility Details</h2>

            {data.stage !== 'planning' && (
              <div>
                <label className="block text-sm font-medium mb-2">Address (if known)</label>
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
              <label className="block text-sm font-medium mb-2">Estimated square footage</label>
              <select
                className="input w-full"
                value={data.squareFootage}
                onChange={(e) => updateData('squareFootage', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="under_2000">Under 2,000 sq ft</option>
                <option value="2000_5000">2,000-5,000 sq ft</option>
                <option value="5000_10000">5,000-10,000 sq ft</option>
                <option value="10000_plus">10,000+ sq ft</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Affects occupancy limits and emergency exits</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Planned amenities</label>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map((amenity) => (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`p-3 rounded-lg border text-left text-sm ${
                      data.amenities.includes(amenity) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
              <button className="button" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Special Features</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showers"
                  checked={data.hasShowers}
                  onChange={(e) => updateData('hasShowers', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="showers">Will have showers/locker rooms</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="pool"
                  checked={data.hasPool}
                  onChange={(e) => updateData('hasPool', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="pool">Will have swimming pool or hot tub</label>
              </div>
            </div>

            {data.hasPool && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Pool Requirements:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Ohio Department of Health pool license required</li>
                  <li>• Certified pool operator on staff</li>
                  <li>• Daily water quality testing and logs</li>
                  <li>• Lifeguard requirements may apply</li>
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required permits and licenses:</strong>
              <ul className="mt-2 space-y-1">
                <li>• City of Cincinnati Business License ($50)</li>
                <li>• Certificate of Occupancy</li>
                <li>• Fire safety inspection</li>
                <li>• ADA compliance certification</li>
                {data.hasShowers && <li>• Plumbing permits for shower facilities</li>}
                {data.hasPool && <li>• Ohio DOH Pool License ($200+)</li>}
                {data.gymType === '24_hour' && <li>• Security system registration</li>}
              </ul>
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(2)}>← Back</button>
              <button className="button" onClick={handleComplete} disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup →'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <strong>What happens next?</strong>
          <ul className="mt-2 space-y-1">
            <li>• We'll create a personalized permit checklist</li>
            <li>• Show you zoning requirements for your location</li>
            <li>• Help with ADA compliance requirements</li>
            <li>• Connect you with insurance and liability resources</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
