'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  numStations: string;
  services: string[];
  hasRetail: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const SERVICES = [
  'Haircuts & styling',
  'Hair coloring',
  'Perms & relaxers',
  'Extensions',
  'Waxing',
  'Makeup',
  'Nails (add-on)'
];

export default function HairSalonWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    numStations: '',
    services: [],
    hasRetail: false
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
    localStorage.setItem('civix_beautyBusinessType', 'hair_salon');
    localStorage.setItem('civix_beautyBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'beauty_personal_care',
          beautyBusinessType: 'hair_salon',
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
          <div className="text-5xl mb-4">💇</div>
          <h1 className="text-3xl font-bold mb-2">Hair Salon Setup</h1>
          <p className="text-gray-600">Let's get your salon properly licensed</p>
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
                placeholder="e.g., Luxe Hair Studio"
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
            <h2 className="text-xl font-bold">Location & Size</h2>

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
              <label className="block text-sm font-medium mb-2">Number of styling stations</label>
              <select
                className="input w-full"
                value={data.numStations}
                onChange={(e) => updateData('numStations', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="1">1 station (just me)</option>
                <option value="2-4">2-4 stations</option>
                <option value="5-10">5-10 stations</option>
                <option value="10+">10+ stations</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Affects ventilation and plumbing requirements</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="retail"
                checked={data.hasRetail}
                onChange={(e) => updateData('hasRetail', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="retail">Planning to sell retail products?</label>
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
              <button className="button" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Services Offered</h2>

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
              <p className="text-sm text-gray-500 mt-2">Some services may require additional certifications</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required licenses:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Ohio Cosmetology Salon License ($60)</li>
                <li>• Each stylist needs a valid Cosmetology License</li>
                <li>• City of Cincinnati Business License ($50)</li>
                {data.hasRetail && <li>• Ohio Vendor License (for retail sales)</li>}
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
            <li>• Estimate fees and timeline</li>
            <li>• Connect you with relevant forms and contacts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
