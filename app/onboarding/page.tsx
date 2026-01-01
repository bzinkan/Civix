'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USER_TYPES = [
  {
    id: 'homeowner',
    icon: '🏠',
    label: 'Homeowner',
    description: 'Managing my property'
  },
  {
    id: 'contractor',
    icon: '🔨',
    label: 'Contractor',
    description: 'Building & renovation'
  },
  {
    id: 'realtor',
    icon: '🏢',
    label: 'Real Estate',
    description: 'Agent or investor'
  },
  {
    id: 'food_business',
    icon: '🍽️',
    label: 'Food Business',
    description: 'Restaurant, truck, bar'
  },
  {
    id: 'small_business',
    icon: '🏪',
    label: 'Small Business',
    description: 'Retail, services'
  },
  {
    id: 'legal',
    icon: '⚖️',
    label: 'Legal / Title',
    description: 'Attorney, escrow'
  },
  {
    id: 'developer',
    icon: '🏗️',
    label: 'Developer',
    description: 'Real estate development'
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectUserType = async (userType: string) => {
    // Food business goes to sub-selection page
    if (userType === 'food_business') {
      router.push('/onboarding/food');
      return;
    }

    setLoading(userType);

    // Store in localStorage for non-authenticated users
    localStorage.setItem('civix_userType', userType);

    // Try to update server profile (will fail if not authenticated, which is fine)
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType })
      });
    } catch {
      // Ignore errors for unauthenticated users
    }

    router.push('/dashboard');
  };

  const handleGuestMode = () => {
    localStorage.setItem('civix_userType', 'homeowner');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Welcome to Civix</h1>
        <p className="text-xl text-gray-600">What brings you here today?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {USER_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectUserType(type.id)}
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

      <button
        onClick={handleGuestMode}
        className="text-gray-500 hover:text-gray-700 underline"
      >
        Just exploring → Guest mode
      </button>
    </div>
  );
}
