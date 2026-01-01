'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  hasCommissary: boolean;
  hasVehicle: boolean;
  vehicleType: 'truck' | 'trailer' | 'cart' | '';
  cuisineType: string;
  stage: 'planning' | 'have_truck' | 'have_commissary' | 'ready_to_operate';
}

export default function FoodTruckWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    hasCommissary: false,
    hasVehicle: false,
    vehicleType: '',
    cuisineType: '',
    stage: 'planning'
  });

  const updateData = (field: keyof WizardData, value: string | boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'food_truck');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'food_truck',
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
          <div className="text-5xl mb-4">🚚</div>
          <h1 className="text-3xl font-bold mb-2">Food Truck Setup</h1>
          <p className="text-gray-600">Mobile food vendor requirements</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Getting Started</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Taco Express"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Where are you in the process?</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'planning', label: 'Just planning' },
                  { id: 'have_truck', label: 'Have a truck/cart' },
                  { id: 'have_commissary', label: 'Have commissary' },
                  { id: 'ready_to_operate', label: 'Ready to operate' }
                ].map((stage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => updateData('stage', stage.id)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      data.stage === stage.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {stage.label}
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
            <h2 className="text-xl font-bold">Vehicle & Commissary</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type</label>
              <select
                className="input w-full"
                value={data.vehicleType}
                onChange={(e) => updateData('vehicleType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="truck">Food Truck</option>
                <option value="trailer">Food Trailer</option>
                <option value="cart">Cart / Push Cart</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="commissary"
                checked={data.hasCommissary}
                onChange={(e) => updateData('hasCommissary', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="commissary">I have a commissary kitchen agreement</label>
            </div>

            {!data.hasCommissary && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <strong>Required:</strong> All food trucks in Cincinnati must have a commissary agreement.
                We'll help you find one.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Cuisine Type</label>
              <select
                className="input w-full"
                value={data.cuisineType}
                onChange={(e) => updateData('cuisineType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="tacos">Tacos / Mexican</option>
                <option value="bbq">BBQ</option>
                <option value="burgers">Burgers / American</option>
                <option value="asian">Asian</option>
                <option value="dessert">Desserts / Ice cream</option>
                <option value="coffee">Coffee / Beverages</option>
                <option value="other">Other</option>
              </select>
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
          <strong>Food truck requirements:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Mobile Food Vendor License ($300/year)</li>
            <li>• Commissary kitchen agreement (required)</li>
            <li>• Health Department vehicle inspection</li>
            <li>• Business license ($50)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
