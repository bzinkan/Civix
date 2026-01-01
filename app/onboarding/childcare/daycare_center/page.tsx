'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface WizardData {
  businessName: string;
  address: string;
  stage: 'planning' | 'location_found' | 'building_out' | 'opening_soon';
  capacity: string;
  ageGroups: string[];
  hasOutdoor: boolean;
  hasKitchen: boolean;
  operatingHours: string;
}

const STAGES = [
  { id: 'planning', label: 'Just planning', description: 'Exploring the idea' },
  { id: 'location_found', label: 'Found a location', description: 'Ready to start buildout' },
  { id: 'building_out', label: 'Building out', description: 'Construction in progress' },
  { id: 'opening_soon', label: 'Opening soon', description: 'Final permits and inspections' }
];

const AGE_GROUPS = [
  'Infants (0-18 months)',
  'Toddlers (18-36 months)',
  'Preschool (3-5 years)',
  'School-age (5-12 years)'
];

export default function DaycareCenterWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WizardData>({
    businessName: '',
    address: '',
    stage: 'planning',
    capacity: '',
    ageGroups: [],
    hasOutdoor: false,
    hasKitchen: false,
    operatingHours: ''
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
    localStorage.setItem('civix_childcareBusinessType', 'daycare_center');
    localStorage.setItem('civix_childcareBusinessData', JSON.stringify(data));

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'childcare_education',
          childcareBusinessType: 'daycare_center',
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
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-3xl font-bold mb-2">Daycare Center Setup</h1>
          <p className="text-gray-600">Licensed childcare requires extensive permits</p>
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
              <label className="block text-sm font-medium mb-2">Center Name (optional)</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., Sunshine Learning Center"
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

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <strong>Important:</strong> Opening a daycare center in Ohio requires ODJFS licensing,
              which involves extensive requirements. Plan for 6-12 months lead time before opening.
            </div>

            <div className="flex justify-between pt-4">
              <Link href="/onboarding/childcare" className="text-gray-500 hover:text-gray-700">← Back</Link>
              <button className="button" onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Capacity & Age Groups</h2>

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
              <label className="block text-sm font-medium mb-2">Planned licensed capacity</label>
              <select
                className="input w-full"
                value={data.capacity}
                onChange={(e) => updateData('capacity', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="13-25">13-25 children</option>
                <option value="26-50">26-50 children</option>
                <option value="51-100">51-100 children</option>
                <option value="100+">100+ children</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Centers with 13+ children require ODJFS Child Care Center License
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Age groups served</label>
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
              <p className="text-sm text-gray-500 mt-2">
                Infant care has the most stringent ratio requirements (1:5 in Ohio)
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setStep(1)}>← Back</button>
              <button className="button" onClick={() => setStep(3)}>Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-6">
            <h2 className="text-xl font-bold">Facility Features</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="outdoor"
                  checked={data.hasOutdoor}
                  onChange={(e) => updateData('hasOutdoor', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="outdoor">Will have outdoor play area</label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="kitchen"
                  checked={data.hasKitchen}
                  onChange={(e) => updateData('hasKitchen', e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="kitchen">Will prepare meals on-site</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Operating hours</label>
              <select
                className="input w-full"
                value={data.operatingHours}
                onChange={(e) => updateData('operatingHours', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="standard">Standard hours (6am-6pm)</option>
                <option value="extended">Extended hours (5am-7pm+)</option>
                <option value="overnight">24-hour/overnight care</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <strong>Required permits and licenses:</strong>
              <ul className="mt-2 space-y-1">
                <li>• ODJFS Child Care Center License ($100-300/year)</li>
                <li>• City of Cincinnati Business License ($50)</li>
                <li>• Fire safety inspection</li>
                <li>• Building/zoning compliance</li>
                <li>• Health Department inspection</li>
                {data.hasKitchen && <li>• Food Service License (if serving meals)</li>}
                {data.hasOutdoor && <li>• Outdoor area safety inspection</li>}
                <li>• BCI/FBI background checks for all staff</li>
                <li>• CPR/First Aid certification for staff</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <strong>Staff Requirements:</strong>
              <ul className="mt-2 space-y-1">
                <li>• Administrator must have Child Development Associate (CDA) or higher</li>
                <li>• Lead teachers need CDA or 12 semester hours in ECE</li>
                <li>• Staff ratios: 1:5 (infants), 1:7 (toddlers), 1:12 (preschool)</li>
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
            <li>• We'll create a comprehensive ODJFS compliance checklist</li>
            <li>• Show you zoning requirements and approval process</li>
            <li>• Guide you through the licensing application</li>
            <li>• Connect you with required training resources</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
