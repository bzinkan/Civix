'use client';

import { useState, useRef, useEffect } from 'react';

interface HelpTooltipProps {
  text: string;
  showIcons: boolean;
  onHideIcons: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function HelpTooltip({
  text,
  showIcons,
  onHideIcons,
  position = 'top'
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!showIcons) return null;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  return (
    <div className="relative inline-flex" ref={tooltipRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 text-xs font-bold transition-colors"
        aria-label="Help"
      >
        ?
      </button>

      {isOpen && (
        <div className={`absolute z-50 ${positionClasses[position]}`}>
          <div className="bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px] max-w-[280px]">
            <p className="mb-3">{text}</p>
            <button
              onClick={() => {
                onHideIcons();
                setIsOpen(false);
              }}
              className="text-gray-400 hover:text-white text-xs underline"
            >
              Hide help icons
            </button>
          </div>
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`} />
        </div>
      )}
    </div>
  );
}
