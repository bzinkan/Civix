'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  cateringType: 'full_service' | 'drop_off' | 'event_only' | '';
  hasKitchen: boolean;
  kitchenType: string;
  hasTransport: boolean;
  servesAlcohol: boolean;
  stage: 'planning' | 'have_kitchen' | 'operating';
}

export default function CateringWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    cateringType: '',
    hasKitchen: false,
    kitchenType: '',
    hasTransport: false,
    servesAlcohol: false,
    stage: 'planning'
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'catering');
    localStorage.setItem('civix_foodBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'catering',
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
          <div className="text-5xl mb-4">🍰</div>
          <h1 className="text-3xl font-bold mb-2">Catering Setup</h1>
          <p className="text-gray-600">Event catering and food service</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Catering Type</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Elegant Events Catering"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type of catering</label>
              <div className="space-y-3">
                {[
                  { id: 'full_service', label: 'Full-service catering', desc: 'On-site cooking and service staff' },
                  { id: 'drop_off', label: 'Drop-off catering', desc: 'Prepared food delivery only' },
                  { id: 'event_only', label: 'Event/party catering', desc: 'Occasional events, not primary business' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => updateData('cateringType', type.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left ${
                      data.cateringType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
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
            <h2 className="text-xl font-bold">Kitchen & Operations</h2>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="kitchen"
                checked={data.hasKitchen}
                onChange={(e) => updateData('hasKitchen', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="kitchen">Do you have a commercial kitchen?</label>
            </div>

            {!data.hasKitchen && (
              <div>
                <label className="block text-sm font-medium mb-2">Kitchen arrangement</label>
                <select
                  className="input w-full"
                  value={data.kitchenType}
                  onChange={(e) => updateData('kitchenType', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="commissary">Will use commissary kitchen</option>
                  <option value="shared">Will use shared/co-working kitchen</option>
                  <option value="planning">Planning to build out kitchen</option>
                </select>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="transport"
                checked={data.hasTransport}
                onChange={(e) => updateData('hasTransport', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="transport">Do you have transport vehicles?</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="alcohol"
                checked={data.servesAlcohol}
                onChange={(e) => updateData('servesAlcohol', e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="alcohol">Will you serve alcohol at events?</label>
            </div>

            {data.servesAlcohol && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <strong>Note:</strong> Serving alcohol at catered events requires either a caterer's
                liquor permit or the venue must have their own liquor license.
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
          <strong>Catering requirements:</strong>
          <ul className="mt-2 space-y-1">
            <li>• Catering establishment license ($300)</li>
            <li>• Commercial kitchen (owned or commissary)</li>
            <li>• Food handler certifications</li>
            <li>• Liability insurance (recommended)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
