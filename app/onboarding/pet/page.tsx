'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PET_BUSINESS_TYPES = [
  {
    id: 'pet_grooming',
    icon: '🐩',
    label: 'Pet Grooming',
    description: 'Grooming salon services',
    wizard: true
  },
  {
    id: 'pet_boarding',
    icon: '🏠',
    label: 'Pet Boarding',
    description: 'Overnight pet care facility',
    wizard: true
  },
  {
    id: 'pet_daycare',
    icon: '🐕',
    label: 'Pet Daycare',
    description: 'Daytime pet supervision',
    wizard: true
  },
  {
    id: 'vet_clinic',
    icon: '🏥',
    label: 'Veterinary Clinic',
    description: 'Animal medical services',
    wizard: true
  },
  {
    id: 'pet_store',
    icon: '🛒',
    label: 'Pet Store',
    description: 'Pet supplies retail',
    wizard: true
  },
  {
    id: 'dog_training',
    icon: '🦮',
    label: 'Dog Training',
    description: 'Obedience and behavior',
    wizard: true
  },
  {
    id: 'pet_sitting',
    icon: '🐈',
    label: 'Pet Sitting',
    description: 'In-home pet care',
    wizard: true
  },
  {
    id: 'mobile_grooming',
    icon: '🚐',
    label: 'Mobile Grooming',
    description: 'At-home grooming van',
    wizard: true
  }
];

export default function PetBusinessSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectPetType = async (petType: string) => {
    setLoading(petType);

    localStorage.setItem('civix_userType', 'pet_industry');
    localStorage.setItem('civix_petBusinessType', petType);

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'pet_industry',
          petBusinessType: petType
        })
      });
    } catch {}

    const petBusiness = PET_BUSINESS_TYPES.find(p => p.id === petType);
    if (petBusiness?.wizard) {
      router.push(`/onboarding/pet/${petType}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🐾</div>
        <h1 className="text-3xl font-bold mb-3">Pet Industry</h1>
        <p className="text-xl text-gray-600">What type of pet business?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {PET_BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectPetType(type.id)}
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
