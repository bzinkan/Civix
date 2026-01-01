'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const FOOD_BUSINESS_TYPES = [
  {
    id: 'restaurant',
    icon: '🍳',
    label: 'Restaurant',
    description: 'Full-service or fast casual dining',
    wizard: true
  },
  {
    id: 'food_truck',
    icon: '🚚',
    label: 'Food Truck',
    description: 'Mobile food vendor',
    wizard: true
  },
  {
    id: 'cottage',
    icon: '🏠',
    label: 'Home-Based',
    description: 'Cottage food production',
    wizard: false
  },
  {
    id: 'ghost_kitchen',
    icon: '👻',
    label: 'Ghost Kitchen',
    description: 'Delivery-only, no storefront',
    wizard: true
  },
  {
    id: 'bar',
    icon: '🍺',
    label: 'Bar / Nightclub',
    description: 'Liquor-focused establishment',
    wizard: true
  },
  {
    id: 'farmers_market',
    icon: '🥕',
    label: 'Farmers Market',
    description: 'Market vendor or operator',
    wizard: true
  },
  {
    id: 'catering',
    icon: '🍰',
    label: 'Catering',
    description: 'Event catering service',
    wizard: true
  },
  {
    id: 'brewery',
    icon: '🍷',
    label: 'Brewery / Distillery',
    description: 'Craft beverage production',
    wizard: true
  }
];

export default function FoodBusinessSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const selectFoodType = async (foodType: string) => {
    setLoading(foodType);

    // Store user type and food business type
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', foodType);

    // Try to update server profile
    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: foodType
        })
      });
    } catch {
      // Ignore errors for unauthenticated users
    }

    // Route to wizard or directly to dashboard
    const foodBusiness = FOOD_BUSINESS_TYPES.find(f => f.id === foodType);
    if (foodBusiness?.wizard) {
      router.push(`/onboarding/food/${foodType}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🍽️</div>
        <h1 className="text-3xl font-bold mb-3">Food Business</h1>
        <p className="text-xl text-gray-600">What type of food business?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-8">
        {FOOD_BUSINESS_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => selectFoodType(type.id)}
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
        ← Back to industries
      </Link>
    </div>
  );
}
