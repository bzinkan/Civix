'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  studioType: 'yoga' | 'hot_yoga' | 'pilates' | 'multi_discipline';
  classCapacity: string;
  hasShowers: boolean;
  sellsRetail: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

export default function YogaStudioWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    studioType: 'yoga',
    classCapacity: '',
    hasShowers: false,
    sellsRetail: false
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'fitness_wellness');
    localStorage.setItem('civix_fitnessBusinessType', 'yoga_studio');
    localStorage.setItem('civix_fitnessBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'fitness_wellness',
          fitnessBusinessType: 'yoga_studio',
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
          <div className="text-5xl mb-4">🧘</div>
          <h1 className="text-3xl font-bold mb-2">Yoga / Pilates Studio Setup</h1>
          <p className="text-gray-600">Get your studio properly licensed</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
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
                placeholder="e.g., Serenity Yoga Studio"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of studio</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'yoga', label: 'Traditional Yoga', desc: 'Vinyasa, Hatha, etc.' },
                  { id: 'hot_yoga', label: 'Hot Yoga', desc: 'Heated room classes' },
                  { id: 'pilates', label: 'Pilates', desc: 'Mat and reformer' },
                  { id: 'multi_discipline', label: 'Multi-Discipline', desc: 'Yoga, pilates, meditation' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('studioType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.studioType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
            <h2 className="text-xl font-bold">Studio Details</h2>

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
              <label className="block text-sm font-medium mb-2">Maximum class capacity</label>
              <select
                className="input w-full"
                value={data.classCapacity}
                onChange={(e) => updateData('classCapacity', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="under_10">Under 10 students</option>
                <option value="10_20">10-20 students</option>
                <option value="20_40">20-40 students</option>
                <option value="40_plus">40+ students</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Affects occupancy permits and space requirements</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showers"
                  checked={data.hasShowers}
                  onChange={(e) => updateData('hasShowers', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="showers">Will have showers/changing rooms</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="retail"
                  checked={data.sellsRetail}
                  onChange={(e) => updateData('sellsRetail', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="retail">Will sell retail products (mats, clothing, etc.)</label>
              </div>
            </div>

            {data.studioType === 'hot_yoga' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Hot Yoga Requirements:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Enhanced HVAC system capable of 95-105°F</li>
                  <li>• Humidity control systems</li>
                  <li>• Additional ventilation requirements</li>
                  <li>• May require special plumbing for humidity</li>
                </ul>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required permits:</strong>
              <ul className="mt-2 space-y-1">
                <li>• City of Cincinnati Business License ($50)</li>
                <li>• Certificate of Occupancy</li>
                <li>• Fire safety inspection (if capacity 50+)</li>
                {data.hasShowers && <li>• Plumbing permits</li>}
                {data.sellsRetail && <li>• Ohio Vendor License (for retail sales)</li>}
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <strong>Good news:</strong> Yoga studios have relatively simple permit requirements
              compared to gyms. No special health department licensing is typically required.
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
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
            <li>• Help with instructor certification resources</li>
            <li>• Connect you with liability insurance options</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
