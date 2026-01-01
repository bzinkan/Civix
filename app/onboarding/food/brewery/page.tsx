'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  breweryType: 'craft_brewery' | 'microbrewery' | 'brewpub' | 'winery' | 'distillery' | '';
  hasTaproom: boolean;
  hasFood: boolean;
  productionVolume: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'operating';
}

export default function BreweryWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    breweryType: '',
    hasTaproom: false,
    hasFood: false,
    productionVolume: '',
    stage: 'planning'
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'brewery');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'brewery',
          foodBusinessData: data
        })
      });
    } catch {}

    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🍷</div>
          <h1 className="text-3xl font-bold mb-2">Brewery / Distillery Setup</h1>
          <p className="text-gray-600">Craft beverage production permits</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Business Type</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Urban Brewing Co."
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of operation</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'craft_brewery', label: 'Craft Brewery', desc: 'Small batch, taproom focus' },
                  { id: 'microbrewery', label: 'Microbrewery', desc: 'Up to 15,000 barrels/year' },
                  { id: 'brewpub', label: 'Brewpub', desc: 'Restaurant with brewing' },
                  { id: 'winery', label: 'Winery', desc: 'Wine production' },
                  { id: 'distillery', label: 'Distillery', desc: 'Spirits production' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('breweryType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.breweryType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Link href="/onboarding/food" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Operations</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="taproom"
                checked={data.hasTaproom}
                onChange={(e) => updateData('hasTaproom', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="taproom">Will you have a taproom / tasting room?</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="food"
                checked={data.hasFood}
                onChange={(e) => updateData('hasFood', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="food">Will you serve food?</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Estimated annual production</label>
              <select
                className="input w-full"
                value={data.productionVolume}
                onChange={(e) => updateData('productionVolume', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="under_1000">Under 1,000 barrels</option>
                <option value="1000_15000">1,000-15,000 barrels</option>
                <option value="over_15000">Over 15,000 barrels</option>
              </select>
            </div>

            {data.breweryType === 'distillery' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <strong>Note:</strong> Distilleries require H-2 (hazardous) occupancy classification
                for production areas due to flammable spirits. Expect significant buildout requirements.
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
              <button className="button" onClick={handleComplete} disabled={loading}>
                {loading ? 'Setting up...' : 'Complete Setup →'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <strong>License options:</strong>
          <ul className="mt-2 space-y-1">
            <li>• A-1-A ($3,500) - Craft brewery with taproom</li>
            <li>• A-1-C ($4,000) - Microbrewery up to 31M barrels</li>
            <li>• A-2 ($3,000) - Winery with tasting room</li>
            <li>• A-3-A ($5,000) - Craft distillery</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
