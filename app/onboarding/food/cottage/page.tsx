'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CottageFoodPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    localStorage.setItem('civix_userType', 'food_business');
    localStorage.setItem('civix_foodBusinessType', 'cottage');

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'food_business',
          foodBusinessType: 'cottage'
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
          <h1 className="text-3xl font-bold mb-2">Cottage Food Production</h1>
          <p className="text-gray-600">Sell homemade food under Ohio law</p>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-bold text-green-700 mb-4">Good News: No License Required!</h2>
          <p className="text-gray-700 mb-4">
            Ohio's Cottage Food Law (ORC 3715.25) allows you to sell certain homemade foods
            without a food license or commercial kitchen.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-green-800 mb-2">What you CAN sell:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
              <div>• Baked goods (bread, cookies, cakes, pies)</div>
              <div>• Candy and confections</div>
              <div>• Jams and jellies</div>
              <div>• Fruit butter</div>
              <div>• Granola and cereal</div>
              <div>• Dry herbs and seasonings</div>
              <div>• Dry baking mixes</div>
              <div>• Popcorn and cotton candy</div>
              <div>• Nut brittles</div>
              <div>• Flavored vinegars</div>
              <div>• Roasted coffee and tea</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-red-800 mb-2">What you CANNOT sell:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-red-700">
              <div>• Foods requiring refrigeration</div>
              <div>• Meat or poultry</div>
              <div>• Dairy products</div>
              <div>• Canned vegetables</div>
              <div>• Fermented foods (kimchi, kombucha)</div>
              <div>• Cut fresh fruits/vegetables</div>
              <div>• Cheesecakes or cream pies</div>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Requirements</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-bold">Sales Limit</h3>
                <p className="text-sm text-gray-600">Maximum $75,000 in annual gross sales</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🏷️</span>
              <div>
                <h3 className="font-bold">Labeling Required</h3>
                <p className="text-sm text-gray-600">
                  Must include: product name, ingredients list, allergens, your name & address,
                  and the statement: "This Product is Home Produced and is Not Subject to State Inspection"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">🛒</span>
              <div>
                <h3 className="font-bold">Direct Sales Only</h3>
                <p className="text-sm text-gray-600">
                  Must sell direct to consumer: farmers markets, farm stands, online with local delivery.
                  Cannot sell wholesale to stores or restaurants.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-bold">Where to Sell</h3>
                <p className="text-sm text-gray-600">
                  Farmers markets, craft fairs, community events, online with in-person delivery,
                  or direct to consumers at your home.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-6 bg-yellow-50 border-yellow-200">
          <h2 className="text-lg font-bold text-yellow-800 mb-2">Want to grow bigger?</h2>
          <p className="text-sm text-yellow-700">
            If you exceed $75,000 in sales or want to sell wholesale, you'll need to use a
            licensed commercial kitchen (commissary). We can help you find one and get properly licensed.
          </p>
        </div>

        <div className="flex justify-between">
          <Link href="/onboarding/food" className="text-gray-500 hover:text-gray-700">
            ← Back
          </Link>
          <button
            className="button"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Continue to Dashboard →'}
          </button>
        </div>
      </div>
    </div>
  );
}
