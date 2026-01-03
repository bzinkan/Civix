'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelpContextType {
  showHelpIcons: boolean;
  setShowHelpIcons: (show: boolean) => void;
  hideHelpIcons: () => void;
  enableHelpIcons: () => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

const HELP_ICONS_KEY = 'civix-help-icons-visible';

export function HelpProvider({ children }: { children: ReactNode }) {
  // Default to true for new users
  const [showHelpIcons, setShowHelpIcons] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(HELP_ICONS_KEY);
    if (stored !== null) {
      setShowHelpIcons(stored === 'true');
    }
  }, []);

  // Save preference to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(HELP_ICONS_KEY, String(showHelpIcons));
    }
  }, [showHelpIcons, mounted]);

  const hideHelpIcons = () => setShowHelpIcons(false);
  const enableHelpIcons = () => setShowHelpIcons(true);

  return (
    <HelpContext.Provider value={{ showHelpIcons, setShowHelpIcons, hideHelpIcons, enableHelpIcons }}>
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}
