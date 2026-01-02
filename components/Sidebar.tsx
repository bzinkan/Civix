'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

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
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => {
        if (data.properties) {
          setProperties(data.properties.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const handleNewChat = () => {
    // Navigate to home and trigger new chat
    window.location.href = '/';
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
        {/* Chats Section */}
        {!isCollapsed && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>Chats</span>
            </h3>
            <div className="space-y-1">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === '/' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                General
              </Link>
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
                  <Link
                    key={prop.id}
                    href={`/properties/${prop.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      pathname === `/properties/${prop.id}` ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <div className="truncate">{prop.nickname || prop.address}</div>
                    {prop.zoneCode && (
                      <div className="text-xs text-gray-500">{prop.zoneCode}</div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700 p-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/settings' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-800'
          } ${isCollapsed ? 'justify-center' : ''}`}
        >
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
