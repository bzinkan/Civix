'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  vendorType: 'produce' | 'prepared_food' | 'cottage_food' | 'meat_eggs' | 'crafts' | 'operator' | '';
  hasExistingBusiness: boolean;
  targetMarkets: string[];
  productTypes: string[];
}

export default function FarmersMarketWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    vendorType: '',
    hasExistingBusiness: false,
    targetMarkets: [],
    productTypes: []
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'farmers_market');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'farmers_market',
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
          <div className="text-5xl mb-4">🥕</div>
          <h1 className="text-3xl font-bold mb-2">Farmers Market</h1>
          <p className="text-gray-600">Vendor or market operator</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">What's your role?</h2>

            <div>
              <label className="block text-sm font-medium mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'produce', label: 'Produce vendor', desc: 'Fruits, vegetables, plants' },
                  { id: 'prepared_food', label: 'Prepared food vendor', desc: 'Ready-to-eat food' },
                  { id: 'cottage_food', label: 'Cottage food vendor', desc: 'Home-baked goods, jams' },
                  { id: 'meat_eggs', label: 'Meat/Eggs vendor', desc: 'Farm-direct meat, eggs' },
                  { id: 'crafts', label: 'Artisan/Crafts', desc: 'Non-food items' },
                  { id: 'operator', label: 'Market operator', desc: 'Running a farmers market' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('vendorType', type.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.vendorType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
            <h2 className="text-xl font-bold">Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business/Farm Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Happy Valley Farm"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="existing"
                checked={data.hasExistingBusiness}
                onChange={(e) => updateData('hasExistingBusiness', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="existing">I already sell at farmers markets</label>
            </div>

            {data.vendorType === 'operator' ? (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
                <strong>Market operator requirements:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Farmers Market Operator License ($250)</li>
                  <li>• Site approval from zoning</li>
                  <li>• Liability insurance</li>
                  <li>• Hand washing station</li>
                  <li>• Waste management plan</li>
                </ul>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Target markets in Cincinnati</label>
                <div className="space-y-2">
                  {['Findlay Market', 'Hyde Park Farmers Market', 'Northside Farmers Market', 'Other'].map((market) => (
                    <div key={market} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.targetMarkets.includes(market)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateData('targetMarkets', [...data.targetMarkets, market]);
                          } else {
                            updateData('targetMarkets', data.targetMarkets.filter(m => m !== market));
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                      <label>{market}</label>
                    </div>
                  ))}
                </div>
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
          <strong>Vendor requirements vary:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Produce: No license if selling whole uncut fruits/vegetables</li>
            <li>• Prepared food: Temporary food permit ($50/event) or food license</li>
            <li>• Cottage food: Home-produced, $75k limit, label required</li>
            <li>• Meat/Eggs: USDA/ODA inspection required for meat</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
