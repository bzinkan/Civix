'use client';

import Sidebar from './Sidebar';
import { HelpProvider } from '../contexts/HelpContext';
import { LocationProvider } from '../contexts/LocationContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <HelpProvider>
      <LocationProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </LocationProvider>
    </HelpProvider>
  );
}
