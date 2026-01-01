'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  services: string[];
  numArtists: string;
  hasSterilization: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const SERVICES = [
  'Tattooing',
  'Body piercing',
  'Permanent makeup',
  'Microblading',
  'Scarification',
  'Cover-up work'
];

export default function TattooShopWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    services: [],
    numArtists: '',
    hasSterilization: false
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'beauty_personal_care');
    localStorage.setItem('civix_beautyBusinessType', 'tattoo_shop');
    localStorage.setItem('civix_beautyBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'beauty_personal_care',
          beautyBusinessType: 'tattoo_shop',
          beautyBusinessData: data
        })
      });
    } catch {}

    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎨</div>
          <h1 className="text-3xl font-bold mb-2">Tattoo & Piercing Shop Setup</h1>
          <p className="text-gray-600">Body art requires specific health permits</p>
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
                placeholder="e.g., Ink Masters Studio"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
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
              <Link href="/onboarding/beauty" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Services & Setup</h2>

            <div>
              <label className="block text-sm font-medium mb-2">What services will you offer?</label>
              <div className="grid grid-cols-2 gap-2">
                {SERVICES.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`p-3 rounded-lg border text-left text-sm ${
                      data.services.includes(service) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Number of artists/technicians</label>
              <select
                className="input w-full"
                value={data.numArtists}
                onChange={(e) => updateData('numArtists', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="1">Just me</option>
                <option value="2-3">2-3 artists</option>
                <option value="4-6">4-6 artists</option>
                <option value="7+">7+ artists</option>
              </select>
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
              <button className="button" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Health & Safety Requirements</h2>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
              <strong className="text-red-800">Critical Requirements:</strong>
              <ul className="mt-2 space-y-1 text-red-700">
                <li>• Hamilton County Health Department inspection required</li>
                <li>• Autoclave or approved sterilization equipment mandatory</li>
                <li>• Bloodborne pathogen training for all artists</li>
                <li>• Single-use needles and proper sharps disposal</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sterilization"
                checked={data.hasSterilization}
                onChange={(e) => updateData('hasSterilization', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="sterilization">I understand I need an autoclave for sterilization</label>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required licenses:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Body Art Establishment License ($300/year)</li>
                <li>• Each artist needs Body Art Operator Permit ($50/year)</li>
                <li>• City of Cincinnati Business License ($50)</li>
                <li>• Hamilton County Health Permit</li>
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

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <strong>Zoning Note:</strong> Tattoo shops often face zoning restrictions. Many zones require
          500-1000 ft distance from schools, churches, and residential areas.
        </div>
      </div>
    </div>
  );
}
