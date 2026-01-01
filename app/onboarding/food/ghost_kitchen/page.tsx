'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  kitchenType: 'own_kitchen' | 'shared_kitchen' | 'commissary' | '';
  platforms: string[];
  cuisineType: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'operating';
}

export default function GhostKitchenWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    kitchenType: '',
    platforms: [],
    cuisineType: '',
    stage: 'planning'
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'ghost_kitchen');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'ghost_kitchen',
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
          <div className="text-5xl mb-4">👻</div>
          <h1 className="text-3xl font-bold mb-2">Ghost Kitchen Setup</h1>
          <p className="text-gray-600">Delivery-only virtual restaurant</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Kitchen Setup</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Brand Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Cloud Wings"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kitchen arrangement</label>
              <div className="space-y-3">
                {[
                  { id: 'own_kitchen', label: 'Own dedicated kitchen', desc: 'Building out your own space' },
                  { id: 'shared_kitchen', label: 'Shared/co-working kitchen', desc: 'Renting time in shared facility' },
                  { id: 'commissary', label: 'Commissary kitchen', desc: 'Operating from licensed commissary' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('kitchenType', type.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left ${
                      data.kitchenType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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

            <div>
              <label className="block text-sm font-medium mb-2">Cuisine type</label>
              <select
                className="input w-full"
                value={data.cuisineType}
                onChange={(e) => updateData('cuisineType', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="wings">Wings</option>
                <option value="burgers">Burgers</option>
                <option value="pizza">Pizza</option>
                <option value="asian">Asian</option>
                <option value="mexican">Mexican</option>
                <option value="healthy">Healthy/Bowls</option>
                <option value="desserts">Desserts</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Delivery platforms</label>
              <div className="space-y-2">
                {['DoorDash', 'UberEats', 'Grubhub', 'Direct/Own website'].map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={data.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateData('platforms', [...data.platforms, platform]);
                        } else {
                          updateData('platforms', data.platforms.filter(p => p !== platform));
                        }
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <label>{platform}</label>
                  </div>
                ))}
              </div>
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
          <strong>Ghost kitchen advantages:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Lower rent (industrial zones allowed)</li>
            <li>• Reduced parking requirements (1/500 sq ft)</li>
            <li>• No public restrooms required</li>
            <li>• F-1 occupancy (not A-2 assembly)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
