'use client';

import Sidebar from './Sidebar';
import { HelpProvider } from '../contexts/HelpContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <HelpProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </HelpProvider>
  );
}
