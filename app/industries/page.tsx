'use client';

import Link from 'next/link';

const INDUSTRIES = [
  {
    id: 'food_business',
    title: 'Food & Beverage',
    icon: '🍽️',
    description: 'Restaurants, food trucks, bars, breweries, catering, and food production',
    color: 'bg-orange-100 border-orange-300',
    href: '/onboarding/food',
    subTypes: [
      { name: 'Restaurant', icon: '🍴' },
      { name: 'Food Truck', icon: '🚚' },
      { name: 'Bar/Nightclub', icon: '🍺' },
      { name: 'Brewery', icon: '🍻' },
      { name: 'Catering', icon: '🍱' },
      { name: 'Cottage Food', icon: '🏠' },
      { name: 'Ghost Kitchen', icon: '👻' },
      { name: 'Farmers Market', icon: '🥕' }
    ],
    tools: ['food-license', 'liquor-license', 'health-prep', 'mobile-vendor', 'cottage-food', 'brewery-license']
  },
  {
    id: 'beauty_personal_care',
    title: 'Beauty & Personal Care',
    icon: '💇',
    description: 'Salons, spas, barbershops, tattoo shops, and personal services',
    color: 'bg-pink-100 border-pink-300',
    href: '/onboarding/beauty',
    subTypes: [
      { name: 'Hair Salon', icon: '💇' },
      { name: 'Barbershop', icon: '💈' },
      { name: 'Nail Salon', icon: '💅' },
      { name: 'Spa', icon: '💆' },
      { name: 'Tattoo Shop', icon: '🎨' },
      { name: 'Massage', icon: '🧘' },
      { name: 'Esthetician', icon: '✨' },
      { name: 'Mobile Beauty', icon: '🚗' }
    ],
    tools: ['cosmetology-license', 'tattoo-permit', 'spa-license']
  },
  {
    id: 'pet_industry',
    title: 'Pet Industry',
    icon: '🐕',
    description: 'Pet grooming, boarding, daycare, veterinary clinics, and pet services',
    color: 'bg-amber-100 border-amber-300',
    href: '/onboarding/pet',
    subTypes: [
      { name: 'Pet Grooming', icon: '🐩' },
      { name: 'Pet Boarding', icon: '🏠' },
      { name: 'Pet Daycare', icon: '🐕' },
      { name: 'Vet Clinic', icon: '🏥' },
      { name: 'Pet Store', icon: '🦴' },
      { name: 'Dog Training', icon: '🎾' },
      { name: 'Pet Sitting', icon: '🐱' },
      { name: 'Mobile Grooming', icon: '🚐' }
    ],
    tools: ['kennel-license', 'pet-grooming', 'vet-clinic']
  },
  {
    id: 'fitness_wellness',
    title: 'Fitness & Wellness',
    icon: '🏋️',
    description: 'Gyms, yoga studios, pools, martial arts, and wellness centers',
    color: 'bg-green-100 border-green-300',
    href: '/onboarding/fitness',
    subTypes: [
      { name: 'Gym', icon: '🏋️' },
      { name: 'Yoga Studio', icon: '🧘' },
      { name: 'CrossFit', icon: '💪' },
      { name: 'Swimming Pool', icon: '🏊' },
      { name: 'Martial Arts', icon: '🥋' },
      { name: 'Dance Studio', icon: '💃' },
      { name: 'Personal Training', icon: '🏃' },
      { name: 'Wellness Center', icon: '🌿' }
    ],
    tools: ['gym-license', 'pool-license', 'yoga-studio']
  },
  {
    id: 'childcare_education',
    title: 'Childcare & Education',
    icon: '👶',
    description: 'Daycare, preschools, tutoring centers, and educational services',
    color: 'bg-blue-100 border-blue-300',
    href: '/onboarding/childcare',
    subTypes: [
      { name: 'Daycare Center', icon: '👶' },
      { name: 'Home Daycare', icon: '🏠' },
      { name: 'Preschool', icon: '🎨' },
      { name: 'Private School', icon: '🏫' },
      { name: 'Tutoring Center', icon: '📚' },
      { name: 'After School', icon: '⏰' },
      { name: 'Summer Camp', icon: '🏕️' },
      { name: 'Enrichment', icon: '🎭' }
    ],
    tools: ['daycare-license', 'preschool-license', 'tutoring-center']
  }
];

export default function IndustriesPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏪</span>
          <h1 className="text-2xl font-bold">Industry-Specific Licensing</h1>
        </div>
        <p className="text-gray-600">
          Get specialized guidance for permits, licenses, and regulations specific to your industry in Cincinnati, Ohio.
        </p>
      </div>

      {/* Industry Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {INDUSTRIES.map((industry) => (
          <div key={industry.id} className={`card border-2 ${industry.color}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{industry.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{industry.title}</h2>
                  <p className="text-gray-600 text-sm">{industry.description}</p>
                </div>
              </div>
            </div>

            {/* Sub-types */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Business Types:</p>
              <div className="flex flex-wrap gap-2">
                {industry.subTypes.map((sub) => (
                  <span key={sub.name} className="px-2 py-1 bg-white rounded text-sm flex items-center gap-1">
                    <span>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Tools */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Popular Tools:</p>
              <div className="flex flex-wrap gap-2">
                {industry.tools.slice(0, 3).map((toolId) => (
                  <Link
                    key={toolId}
                    href={`/tools/${toolId}`}
                    className="px-3 py-1 bg-white border rounded-full text-sm hover:bg-gray-50"
                  >
                    {toolId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3 mt-4">
              <Link href={industry.href} className="button flex-1 text-center">
                Get Started →
              </Link>
              <Link href={`/tools?category=${industry.id}`} className="button-secondary flex-1 text-center">
                View All Tools
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Other Business Types */}
      <div className="card">
        <h2 className="text-lg font-bold mb-3">Other Business Types</h2>
        <p className="text-gray-600 mb-4">
          Don't see your industry? We also support general small businesses, contractors, real estate professionals, and more.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/onboarding" className="button-secondary">
            🏠 Homeowner
          </Link>
          <Link href="/onboarding" className="button-secondary">
            🔨 Contractor
          </Link>
          <Link href="/onboarding" className="button-secondary">
            🏢 Real Estate
          </Link>
          <Link href="/onboarding" className="button-secondary">
            ⚖️ Legal Professional
          </Link>
          <Link href="/onboarding" className="button-secondary">
            📋 Title & Escrow
          </Link>
          <Link href="/onboarding" className="button-secondary">
            🏗️ Developer
          </Link>
          <Link href="/onboarding" className="button-secondary">
            🏪 Small Business
          </Link>
        </div>
      </div>
    </div>
  );
}
