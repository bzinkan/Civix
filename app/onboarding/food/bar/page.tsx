'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  barType: 'bar' | 'nightclub' | 'sports_bar' | 'wine_bar' | 'cocktail_lounge' | '';
  hasFood: boolean;
  foodPercentage: string;
  hasEntertainment: boolean;
  entertainmentType: string[];
  capacity: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
}

export default function BarWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    barType: '',
    hasFood: false,
    foodPercentage: '',
    hasEntertainment: false,
    entertainmentType: [],
    capacity: '',
    stage: 'planning'
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'bar');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'bar',
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
          <div className="text-5xl mb-4">🍺</div>
          <h1 className="text-3xl font-bold mb-2">Bar / Nightclub Setup</h1>
          <p className="text-gray-600">Liquor license and entertainment permits</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Bar Type</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., The Blue Room"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of establishment</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bar', label: 'Bar / Pub' },
                  { id: 'nightclub', label: 'Nightclub' },
                  { id: 'sports_bar', label: 'Sports Bar' },
                  { id: 'wine_bar', label: 'Wine Bar' },
                  { id: 'cocktail_lounge', label: 'Cocktail Lounge' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('barType', type.id)}
                    className={`p-4 rounded-lg border-2 ${
                      data.barType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type.label}
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
            <h2 className="text-xl font-bold">Food & Capacity</h2>

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

            {data.hasFood && (
              <div>
                <label className="block text-sm font-medium mb-2">Food sales percentage</label>
                <select
                  className="input w-full"
                  value={data.foodPercentage}
                  onChange={(e) => updateData('foodPercentage', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="under_25">Under 25% (bar focus)</option>
                  <option value="25_50">25-50% (bar with food)</option>
                  <option value="over_50">Over 50% (restaurant with bar)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  D-5 license requires 50%+ food sales. D-5K has no food requirement.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Expected capacity</label>
              <select
                className="input w-full"
                value={data.capacity}
                onChange={(e) => updateData('capacity', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="under_50">Under 50</option>
                <option value="50_100">50-100</option>
                <option value="100_200">100-200</option>
                <option value="over_200">200+</option>
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
            <h2 className="text-xl font-bold">Entertainment</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="entertainment"
                checked={data.hasEntertainment}
                onChange={(e) => updateData('hasEntertainment', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="entertainment">Will you have live entertainment?</label>
            </div>

            {data.hasEntertainment && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Entertainment types</label>
                {['Live music', 'DJ', 'Dancing', 'Karaoke', 'Trivia/Games'].map((ent) => (
                  <div key={ent} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.entertainmentType.includes(ent)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateData('entertainmentType', [...data.entertainmentType, ent]);
                        } else {
                          updateData('entertainmentType', data.entertainmentType.filter(t => t !== ent));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <label>{ent}</label>
                  </div>
                ))}
                <p className="text-sm text-gray-500 mt-2">
                  Live music, DJ, and dancing require an entertainment permit ($200)
                </p>
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
          <strong>Liquor license options:</strong>
          <ul className="mt-2 space-y-1">
            <li>• D-5 ($4,500) - Full liquor, requires 50%+ food sales</li>
            <li>• D-5K ($5,500) - Full liquor, no food requirement</li>
            <li>• D-3 ($2,500) - Beer and wine only</li>
            <li>• Entertainment permit ($200) - Required for live music/DJ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
