'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/lookup', label: 'Lookup', icon: '🔍' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/tools', label: 'Tools', icon: '🛠️' },
  { href: '/saved', label: 'Saved', icon: '📁' },
  { href: '/settings', label: 'Settings', icon: '⚙️' }
];

export default function Navbar() {
  const pathname = usePathname();

  // Don't show full nav on onboarding page
  if (pathname === '/onboarding') {
    return (
      <header className="border-b border-gray-200 bg-white">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            CIVIX
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
            CIVIX
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-1">
            {NAV_ITEMS.slice(0, 4).map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center px-3 py-1 rounded-lg transition-colors ${
                    isActive
                      ? 'text-blue-700'
                      : 'text-gray-600'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
