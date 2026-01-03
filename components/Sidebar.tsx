'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useHelp } from '../contexts/HelpContext';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
  propertyId: string | null;
}

interface SavedProperty {
  id: string;
  address: string;
  nickname: string | null;
  zoneCode: string | null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { showHelpIcons, enableHelpIcons } = useHelp();

  const fetchProperties = () => {
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        if (data.properties) {
          setProperties(data.properties.slice(0, 5));
        }
      })
      .catch(() => {});
  };

  const handleDeleteProperty = async (e: React.MouseEvent, propertyId: string) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProperties();
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
    }
  };

  useEffect(() => {
    // Fetch conversations
    fetch('/api/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.conversations) {
          setConversations(data.conversations.slice(0, 5));
        }
      })
      .catch(() => {});

    // Fetch saved properties
    fetchProperties();

    // Listen for property saved event to refresh list
    const handlePropertySaved = () => {
      fetchProperties();
    };
    window.addEventListener('civix-property-saved', handlePropertySaved);
    return () => window.removeEventListener('civix-property-saved', handlePropertySaved);
  }, []);

  const handleNewChat = () => {
    // Dispatch event to clear state, then navigate
    window.dispatchEvent(new CustomEvent('civix-new-chat'));
    // If already on home page, just clear state (event handles it)
    // If on another page, navigate to home
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  return (
    <aside className={`bg-gray-900 text-white flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <Link href="/" className={`text-xl font-bold text-blue-400 ${isCollapsed ? 'hidden' : 'block'}`}>
          CIVIX
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '>' : '<'}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className={`w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span>+</span>
          {!isCollapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Chats Section - only show if there are conversations */}
        {!isCollapsed && conversations.length > 0 && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Recent Chats
            </h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={conv.propertyId ? `/properties/${conv.propertyId}` : `/`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                    pathname.includes(conv.id) ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  title={conv.title || 'Untitled'}
                >
                  {conv.title || 'Untitled Chat'}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Properties Section */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-t border-gray-700 mt-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Properties</span>
              <Link href="/properties" className="text-blue-400 hover:text-blue-300 text-xs normal-case">
                View All
              </Link>
            </h3>
            <div className="space-y-1">
              {properties.length === 0 ? (
                <p className="text-xs text-gray-500 px-3 py-2">No saved properties</p>
              ) : (
                properties.map((prop) => (
                  <div key={prop.id} className="group relative">
                    <Link
                      href={`/properties/${prop.id}`}
                      className={`block px-3 py-2 pr-8 rounded-lg text-sm transition-colors ${
                        pathname === `/properties/${prop.id}` ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <div className="truncate">{prop.nickname || prop.address}</div>
                      {prop.zoneCode && (
                        <div className="text-xs text-gray-500">{prop.zoneCode}</div>
                      )}
                    </Link>
                    <button
                      onClick={(e) => handleDeleteProperty(e, prop.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded transition-all"
                      title="Delete property"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 p-3 space-y-1">
        {/* Help link - shows option to enable help icons when they're hidden */}
        {!isCollapsed && !showHelpIcons && (
          <button
            onClick={enableHelpIcons}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-gray-300 hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Show Help Icons</span>
          </button>
        )}
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/settings' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && <span>Settings</span>}
        </Link>
        <Link
          href="/about"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/about' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {!isCollapsed && <span>About</span>}
        </Link>
      </div>
    </aside>
  );
}
