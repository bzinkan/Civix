'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FITNESS_BUSINESS_TYPES = [
  {
    id: 'gym',
    icon: '🏋️',
    label: 'Gym / Fitness Center',
    description: 'Full-service fitness facility',
    wizard: true
  },
  {
    id: 'yoga_studio',
    icon: '🧘',
    label: 'Yoga Studio',
    description: 'Yoga and meditation classes',
    wizard: true
  },
  {
    id: 'crossfit_gym',
    icon: '💪',
    label: 'CrossFit / HIIT',
    description: 'High-intensity training',
    wizard: true
  },
  {
    id: 'swimming_pool',
    icon: '🏊',
    label: 'Swimming Pool',
    description: 'Pool facility or swim school',
    wizard: true
  },
  {
    id: 'martial_arts',
    icon: '🥋',
    label: 'Martial Arts',
    description: 'Karate, MMA, boxing studio',
    wizard: true
  },
  {
    id: 'dance_studio',
    icon: '💃',
    label: 'Dance Studio',
    description: 'Dance classes and lessons',
    wizard: true
  },
  {
    id: 'personal_training',
    icon: '🏃',
    label: 'Personal Training',
    description: 'One-on-one fitness coaching',
    wizard: true
  },
  {
    id: 'wellness_center',
    icon: '🌿',
    label: 'Wellness Center',
    description: 'Holistic health services',
    wizard: true
  }
];

export default function FitnessBusinessSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectFitnessType = async (fitnessType: string) => {
    setLoading(fitnessType);

    localStorage.setItem('civix_userType', 'fitness_wellness');
    localStorage.setItem('civix_fitnessBusinessType', fitnessType);

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'fitness_wellness',
          fitnessBusinessType: fitnessType
        })
      });
    } catch {}

    const fitnessBusiness = FITNESS_BUSINESS_TYPES.find(f => f.id === fitnessType);
    if (fitnessBusiness?.wizard) {
      router.push(`/onboarding/fitness/${fitnessType}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">💪</div>
        <h1 className="text-3xl font-bold mb-3">Fitness & Wellness</h1>
        <p className="text-xl text-gray-600">What type of fitness business?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {FITNESS_BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectFitnessType(type.id)}
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
