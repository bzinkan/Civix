'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  boardingType: 'kennel' | 'home_based' | 'luxury';
  capacity: string;
  services: string[];
  hasOutdoorArea: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const SERVICES = [
  'Overnight boarding',
  'Daycare (drop-in)',
  'Grooming add-on',
  'Training',
  'Pick-up/delivery',
  'Webcam viewing',
  'Medication admin'
];

export default function PetBoardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    boardingType: 'kennel',
    capacity: '',
    services: [],
    hasOutdoorArea: false
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
    localStorage.setItem('civix_userType', 'pet_industry');
    localStorage.setItem('civix_petBusinessType', 'pet_boarding');
    localStorage.setItem('civix_petBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'pet_industry',
          petBusinessType: 'pet_boarding',
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
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold mb-2">Pet Boarding Facility Setup</h1>
          <p className="text-gray-600">Kennels and boarding require specific permits</p>
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
                placeholder="e.g., Happy Tails Boarding"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of boarding facility</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'kennel', label: 'Traditional Kennel', desc: 'Standard indoor/outdoor runs' },
                  { id: 'home_based', label: 'Home-Based', desc: 'In-home pet sitting' },
                  { id: 'luxury', label: 'Luxury/Resort', desc: 'Premium accommodations' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('boardingType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.boardingType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
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
            <h2 className="text-xl font-bold">Capacity & Services</h2>

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
              <label className="block text-sm font-medium mb-2">Planned capacity (number of animals)</label>
              <select
                className="input w-full"
                value={data.capacity}
                onChange={(e) => updateData('capacity', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="1-5">1-5 (home-based)</option>
                <option value="6-15">6-15 (small kennel)</option>
                <option value="16-30">16-30 (medium facility)</option>
                <option value="30+">30+ (large facility)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Capacity affects licensing requirements</p>
            </div>

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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="outdoor"
                checked={data.hasOutdoorArea}
                onChange={(e) => updateData('hasOutdoorArea', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="outdoor">Will have outdoor exercise area</label>
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <strong>Important:</strong> Pet boarding facilities are regulated by the Ohio Department
              of Agriculture and must meet specific kennel licensing requirements.
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required permits and licenses:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Ohio Dog Kennel License (ODA) - Required for 5+ dogs</li>
                <li>• City of Cincinnati Business License ($50)</li>
                <li>• Zoning approval (kennels often restricted)</li>
                <li>• Building permits for any construction</li>
                {data.hasOutdoorArea && <li>• Fencing requirements per ODA standards</li>}
                <li>• Hamilton County Health inspection</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
              <strong className="text-red-800">Zoning Alert:</strong>
              <p className="mt-1 text-red-700">
                Kennels and boarding facilities are typically NOT allowed in residential zones.
                You'll need Commercial or Industrial zoning, or a conditional use permit.
                We'll help you verify zoning for your location.
              </p>
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
            <li>• We'll verify zoning for your planned location</li>
            <li>• Create a comprehensive permit checklist</li>
            <li>• Connect you with ODA licensing resources</li>
            <li>• Help you understand facility requirements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
