'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CHILDCARE_BUSINESS_TYPES = [
  {
    id: 'daycare_center',
    icon: '🏫',
    label: 'Daycare Center',
    description: 'Licensed childcare facility',
    wizard: true
  },
  {
    id: 'home_daycare',
    icon: '🏠',
    label: 'Home Daycare',
    description: 'In-home childcare (Type A/B)',
    wizard: true
  },
  {
    id: 'preschool',
    icon: '🎨',
    label: 'Preschool',
    description: 'Early childhood education',
    wizard: true
  },
  {
    id: 'private_school',
    icon: '📚',
    label: 'Private School',
    description: 'K-12 private education',
    wizard: true
  },
  {
    id: 'tutoring_center',
    icon: '✏️',
    label: 'Tutoring Center',
    description: 'Academic tutoring services',
    wizard: true
  },
  {
    id: 'after_school',
    icon: '🎯',
    label: 'After-School Program',
    description: 'School-age care programs',
    wizard: true
  },
  {
    id: 'summer_camp',
    icon: '⛺',
    label: 'Summer Camp',
    description: 'Day or overnight camps',
    wizard: true
  },
  {
    id: 'enrichment',
    icon: '🎵',
    label: 'Enrichment Classes',
    description: 'Music, art, STEM for kids',
    wizard: true
  }
];

export default function ChildcareBusinessSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectChildcareType = async (childcareType: string) => {
    setLoading(childcareType);

    localStorage.setItem('civix_userType', 'childcare_education');
    localStorage.setItem('civix_childcareBusinessType', childcareType);

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'childcare_education',
          childcareBusinessType: childcareType
        })
      });
    } catch {}

    const childcareBusiness = CHILDCARE_BUSINESS_TYPES.find(c => c.id === childcareType);
    if (childcareBusiness?.wizard) {
      router.push(`/onboarding/childcare/${childcareType}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">👶</div>
        <h1 className="text-3xl font-bold mb-3">Childcare & Education</h1>
        <p className="text-xl text-gray-600">What type of childcare business?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {CHILDCARE_BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectChildcareType(type.id)}
            disabled={loading !== null}
            className={`card hover:shadow-xl hover:border-blue-500 border-2 border-transparent transition-all cursor-pointer text-left ${
              loading === type.id ? 'opacity-50' : ''
            }`}
          >
            <div className="text-4xl mb-3">{type.icon}</div>
            <h3 className="text-lg font-semibold mb-1">{type.label}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
            {loading === type.id && (
              <div className="mt-2 text-sm text-blue-600">Loading...</div>
            )}
          </button>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="text-gray-500 hover:text-gray-700 underline"
      >
        Back to industries
      </Link>
    </div>
  );
}
