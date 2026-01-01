'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'preparing' | 'applying' | 'opening_soon';
  licenseType: 'type_a' | 'type_b';
  ageGroups: string[];
  hasAssistant: boolean;
  hasOutdoor: boolean;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'preparing', label: 'Preparing home', description: 'Making modifications' },
  { id: 'applying', label: 'Applying', description: 'License application in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final inspections' }
];

const AGE_GROUPS = [
  'Infants (0-18 months)',
  'Toddlers (18-36 months)',
  'Preschool (3-5 years)',
  'School-age (5-12 years)'
];

export default function HomeDaycareWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    licenseType: 'type_b',
    ageGroups: [],
    hasAssistant: false,
    hasOutdoor: false
  });

  const updateData = (field: keyof WizardData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAgeGroup = (group: string) => {
    setData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(group)
        ? prev.ageGroups.filter(g => g !== group)
        : [...prev.ageGroups, group]
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'childcare_education');
    localStorage.setItem('civix_childcareBusinessType', 'home_daycare');
    localStorage.setItem('civix_childcareBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'childcare_education',
          childcareBusinessType: 'home_daycare',
          childcareBusinessData: data
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
          <h1 className="text-3xl font-bold mb-2">Home Daycare Setup</h1>
          <p className="text-gray-600">Type A or Type B home provider</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-3 h-3 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">License Type</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Which license type?</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => updateData('licenseType', 'type_b')}
                  className={`p-4 rounded-lg border-2 text-left ${
                    data.licenseType === 'type_b' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Type B Home (1-6 children)</div>
                  <div className="text-sm text-gray-500">
                    Care for up to 6 children. Simpler requirements. No assistant required.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateData('licenseType', 'type_a')}
                  className={`p-4 rounded-lg border-2 text-left ${
                    data.licenseType === 'type_a' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Type A Home (7-12 children)</div>
                  <div className="text-sm text-gray-500">
                    Care for up to 12 children. Requires assistant. More requirements.
                  </div>
                </button>
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
              <Link href="/onboarding/childcare" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Little Stars Home Daycare"
                value={data.businessName}
                onChange={(e) => updateData('businessName', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Home Address</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., 123 Main St, Cincinnati, OH"
                value={data.address}
                onChange={(e) => updateData('address', e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">Your home will be inspected for licensing</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Age groups you'll serve</label>
              <div className="grid grid-cols-2 gap-2">
                {AGE_GROUPS.map((group) => (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleAgeGroup(group)}
                    className={`p-3 rounded-lg border text-left text-sm ${
                      data.ageGroups.includes(group) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {group}
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
            <h2 className="text-xl font-bold">Home Requirements</h2>

            <div className="space-y-4">
              {data.licenseType === 'type_a' && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="assistant"
                    checked={data.hasAssistant}
                    onChange={(e) => updateData('hasAssistant', e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <label htmlFor="assistant">I will have an assistant (required for Type A)</label>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="outdoor"
                  checked={data.hasOutdoor}
                  onChange={(e) => updateData('hasOutdoor', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="outdoor">Have fenced outdoor play area</label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required for {data.licenseType === 'type_a' ? 'Type A' : 'Type B'} License:</strong>
              <ul className="mt-2 space-y-1">
                <li>• ODJFS {data.licenseType === 'type_a' ? 'Type A' : 'Type B'} Home License ($50/year)</li>
                <li>• BCI/FBI background check for all adults in home</li>
                <li>• CPR/First Aid certification</li>
                <li>• Pre-licensing orientation (6 hours)</li>
                <li>• Home inspection by ODJFS</li>
                <li>• Fire inspection</li>
                <li>• {data.licenseType === 'type_a' ? '45' : '15'} square feet per child (indoor)</li>
                {data.licenseType === 'type_a' && <li>• Assistant with background check</li>}
                <li>• Smoke detectors, fire extinguisher</li>
                <li>• Liability insurance (recommended)</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <strong>Ohio Ratios for Home Providers:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Type B: Max 6 children, max 3 under age 2</li>
                <li>• Type A: Max 12 children, max 4 under age 2 (with assistant)</li>
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
            <li>• We'll create your personalized licensing checklist</li>
            <li>• Help you prepare your home for inspection</li>
            <li>• Guide you through the ODJFS application</li>
            <li>• Connect you with required training programs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
