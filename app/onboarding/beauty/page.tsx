'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BEAUTY_BUSINESS_TYPES = [
  {
    id: 'hair_salon',
    icon: '💇',
    label: 'Hair Salon',
    description: 'Cut, color, styling services',
    wizard: true
  },
  {
    id: 'barbershop',
    icon: '💈',
    label: 'Barbershop',
    description: 'Traditional barber services',
    wizard: true
  },
  {
    id: 'nail_salon',
    icon: '💅',
    label: 'Nail Salon',
    description: 'Manicure, pedicure services',
    wizard: true
  },
  {
    id: 'spa',
    icon: '🧖',
    label: 'Day Spa',
    description: 'Full spa treatments',
    wizard: true
  },
  {
    id: 'tattoo_shop',
    icon: '🎨',
    label: 'Tattoo / Piercing',
    description: 'Body art studio',
    wizard: true
  },
  {
    id: 'massage_establishment',
    icon: '💆',
    label: 'Massage',
    description: 'Licensed massage therapy',
    wizard: true
  },
  {
    id: 'esthetician',
    icon: '✨',
    label: 'Esthetician',
    description: 'Skincare, facials, waxing',
    wizard: true
  },
  {
    id: 'mobile_beauty',
    icon: '🚗',
    label: 'Mobile Services',
    description: 'At-home beauty services',
    wizard: true
  }
];

export default function BeautyBusinessSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectBeautyType = async (beautyType: string) => {
    setLoading(beautyType);

    localStorage.setItem('civix_userType', 'beauty_personal_care');
    localStorage.setItem('civix_beautyBusinessType', beautyType);

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'beauty_personal_care',
          beautyBusinessType: beautyType
        })
      });
    } catch {}

    const beautyBusiness = BEAUTY_BUSINESS_TYPES.find(b => b.id === beautyType);
    if (beautyBusiness?.wizard) {
      router.push(`/onboarding/beauty/${beautyType}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">💇</div>
        <h1 className="text-3xl font-bold mb-3">Beauty & Personal Care</h1>
        <p className="text-xl text-gray-600">What type of beauty business?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {BEAUTY_BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectBeautyType(type.id)}
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
