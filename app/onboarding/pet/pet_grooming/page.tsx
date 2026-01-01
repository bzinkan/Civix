'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  groomingType: 'storefront' | 'mobile' | 'both';
  services: string[];
  animalsServed: string[];
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const SERVICES = [
  'Full grooming',
  'Bath & brush',
  'Nail trimming',
  'De-shedding',
  'Ear cleaning',
  'Teeth brushing',
  'Creative grooming'
];

const ANIMALS = ['Dogs', 'Cats', 'Small animals', 'Exotic pets'];

export default function PetGroomingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    groomingType: 'storefront',
    services: [],
    animalsServed: []
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

  const toggleAnimal = (animal: string) => {
    setData(prev => ({
      ...prev,
      animalsServed: prev.animalsServed.includes(animal)
        ? prev.animalsServed.filter(a => a !== animal)
        : [...prev.animalsServed, animal]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'pet_industry');
    localStorage.setItem('civix_petBusinessType', 'pet_grooming');
    localStorage.setItem('civix_petBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'pet_industry',
          petBusinessType: 'pet_grooming',
          petBusinessData: data
        })
      });
    } catch {}

    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🐩</div>
          <h1 className="text-3xl font-bold mb-2">Pet Grooming Setup</h1>
          <p className="text-gray-600">Get your grooming business properly licensed</p>
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
                placeholder="e.g., Pampered Paws"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of grooming business</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'storefront', label: 'Storefront', desc: 'Fixed location salon' },
                  { id: 'mobile', label: 'Mobile', desc: 'Grooming van/trailer' },
                  { id: 'both', label: 'Both', desc: 'Shop + mobile service' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('groomingType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.groomingType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.desc}</div>
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
              <Link href="/onboarding/pet" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Services & Animals</h2>

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
              <label className="block text-sm font-medium mb-2">What animals will you groom?</label>
              <div className="grid grid-cols-2 gap-2">
                {ANIMALS.map((animal) => (
                  <button
                    key={animal}
                    type="button"
                    onClick={() => toggleAnimal(animal)}
                    className={`p-3 rounded-lg border text-left text-sm ${
                      data.animalsServed.includes(animal) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {animal}
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
            <h2 className="text-xl font-bold">Requirements Summary</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <strong className="text-green-800">Good news!</strong>
              <p className="mt-1 text-green-700">
                Ohio doesn't require state licensing for pet groomers. However, professional
                certification is recommended and may help with insurance rates.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required permits:</strong>
              <ul className="mt-2 space-y-1">
                <li>• City of Cincinnati Business License ($50)</li>
                {data.groomingType === 'storefront' || data.groomingType === 'both' ? (
                  <>
                    <li>• Zoning compliance verification</li>
                    <li>• Building occupancy permit (if new buildout)</li>
                  </>
                ) : null}
                {data.groomingType === 'mobile' || data.groomingType === 'both' ? (
                  <>
                    <li>• Mobile vendor permit</li>
                    <li>• Vehicle registration/inspection</li>
                  </>
                ) : null}
                <li>• General liability insurance (recommended)</li>
              </ul>
            </div>

            {data.animalsServed.includes('Exotic pets') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Note:</strong> Grooming exotic animals may require additional permits
                depending on the species. Check with Ohio Department of Agriculture.
              </div>
            )}

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
            <li>• Help you find insurance providers</li>
            <li>• Connect you with professional certification programs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
