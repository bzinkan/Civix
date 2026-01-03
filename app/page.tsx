'use client';

import { useState, useCallback, useEffect } from 'react';
import AddressInput from '../components/AddressInput';
import PropertyCard, { PropertyData } from '../components/PropertyCard';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import EmptyState from '../components/EmptyState';
import { ChatMessageProps } from '../components/ChatMessage';
import { generateLabel, shortenAddress, LabeledAddress } from '../components/MultiAddressBar';
import HelpTooltip from '../components/HelpTooltip';
import { useHelp } from '../contexts/HelpContext';

interface UnsupportedCity {
  city: string;
  state: string;
  jurisdictionId: string;
  address: string;
  waitlistCount: number;
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<LabeledAddress[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unsupportedCity, setUnsupportedCity] = useState<UnsupportedCity | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const { showHelpIcons, hideHelpIcons } = useHelp();

  // Listen for new chat event from sidebar
  useEffect(() => {
    const handleNewChat = () => {
      setMessages([]);
      setAddresses([]);
      setConversationId(null);
      setUnsupportedCity(null);
      setWaitlistEmail('');
      setWaitlistSubmitted(false);
      setCompareMode(false);
    };

    window.addEventListener('civix-new-chat', handleNewChat);
    return () => window.removeEventListener('civix-new-chat', handleNewChat);
  }, []);

  // Get the currently active address/property
  const activeAddress = addresses.find(a => a.isActive);
  const property = activeAddress?.property || null;

  // Add a new address
  const handleAddAddress = useCallback((address: string, propertyData: PropertyData | null) => {
    setUnsupportedCity(null);
    setWaitlistSubmitted(false);

    const newId = `addr-${Date.now()}`;
    const newLabel = generateLabel(addresses.length);

    // Set all existing addresses to inactive, add new one as active
    setAddresses(prev => [
      ...prev.map(a => ({ ...a, isActive: false })),
      {
        id: newId,
        label: newLabel,
        address: address,
        shortAddress: shortenAddress(address),
        property: propertyData,
        isActive: true,
      },
    ]);
  }, [addresses.length]);

  // Remove an address
  const handleRemoveAddress = useCallback((id: string) => {
    setAddresses(prev => {
      const filtered = prev.filter(a => a.id !== id);
      // If we removed the active one, make the last one active
      const wasActive = prev.find(a => a.id === id)?.isActive;
      if (wasActive && filtered.length > 0) {
        filtered[filtered.length - 1].isActive = true;
      }
      // Re-label A, B, C, etc.
      return filtered.map((a, i) => ({ ...a, label: generateLabel(i) }));
    });
    // Turn off compare mode if less than 2 addresses
    setCompareMode(prev => prev && addresses.length > 2);
  }, [addresses.length]);

  // Set active address
  const handleSetActiveAddress = useCallback((id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isActive: a.id === id })));
  }, []);

  const handlePropertyLookup = useCallback((propertyData: any) => {
    if (propertyData.supported === false) {
      setUnsupportedCity({
        city: propertyData.city,
        state: propertyData.state,
        jurisdictionId: propertyData.jurisdictionId,
        address: propertyData.address,
        waitlistCount: propertyData.waitlistCount || 0,
      });
    }
  }, []);

  const handleWaitlistSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsupportedCity || !waitlistEmail) return;

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: waitlistEmail,
          jurisdictionId: unsupportedCity.jurisdictionId,
          cityName: unsupportedCity.city,
          stateCode: unsupportedCity.state,
          addressSearched: unsupportedCity.address,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWaitlistSubmitted(true);
        if (data.waitlistCount) {
          setUnsupportedCity(prev => prev ? { ...prev, waitlistCount: data.waitlistCount } : null);
        }
      }
    } catch (error) {
      console.error('Waitlist error:', error);
    }
  }, [unsupportedCity, waitlistEmail]);

  const handleSaveProperty = useCallback(async () => {
    if (!property || !activeAddress) return;

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: property.address }),
      });

      if (res.ok) {
        // Mark this address as saved
        setAddresses(prev => prev.map(a =>
          a.id === activeAddress.id ? { ...a, isSaved: true } : a
        ));
        // Dispatch event to refresh sidebar properties list
        window.dispatchEvent(new CustomEvent('civix-property-saved'));
      }
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  }, [property, activeAddress]);

  const handleClearProperty = useCallback(() => {
    if (activeAddress) {
      handleRemoveAddress(activeAddress.id);
    }
    setUnsupportedCity(null);
  }, [activeAddress, handleRemoveAddress]);

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message to UI immediately
    const userMessage: ChatMessageProps = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Build context with all addresses for comparison questions
      const allAddressesContext = addresses.map(a => ({
        label: a.label,
        address: a.address,
        property: a.property,
        isActive: a.isActive,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          address: property?.address,
          propertyContext: property,
          // Include all addresses for multi-address comparison
          allAddresses: allAddressesContext.length > 1 ? allAddressesContext : undefined,
          compareMode: compareMode && allAddressesContext.length > 1,
        }),
      });

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant message
      const assistantMessage: ChatMessageProps = {
        role: 'assistant',
        content: data.answer || data.message || 'Sorry, I could not process your request.',
        citations: data.citations,
        attachments: data.attachments,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessageProps = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, property, addresses, compareMode]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Address Input Bar - Always visible */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto space-y-3">
          {/* Always-visible address input */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AddressInput
                onAddressSelect={handleAddAddress}
                onPropertyLookup={handlePropertyLookup}
                placeholder={addresses.length === 0 ? "Enter an address for property-specific answers..." : "Add another address to compare..."}
              />
            </div>
            {addresses.length === 0 && (
              <HelpTooltip
                text="Enter any address to get property-specific information like zoning, permits, and regulations. You can add multiple addresses to compare them."
                showIcons={showHelpIcons}
                onHideIcons={hideHelpIcons}
                position="left"
              />
            )}
          </div>

          {/* Address chips row - only show when there are addresses */}
          {addresses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => handleSetActiveAddress(addr.id)}
                  className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    addr.isActive
                      ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {/* Location pin icon */}
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{addr.shortAddress}</span>
                  {/* Label badge */}
                  <span className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                    addr.isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {addr.label}
                  </span>
                  {/* Remove button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAddress(addr.id);
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-300 rounded-full"
                    title="Remove address"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}

              {/* Compare mode toggle - only show with 2+ addresses */}
              {addresses.length >= 2 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                      compareMode
                        ? 'bg-purple-100 text-purple-800 ring-2 ring-purple-400'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    title={compareMode ? "Compare mode on" : "Enable compare mode"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium">Compare</span>
                  </button>
                  <HelpTooltip
                    text="Compare mode lets you ask questions about multiple addresses at once. Toggle this on, then ask something like 'Which property has better zoning for a restaurant?'"
                    showIcons={showHelpIcons}
                    onHideIcons={hideHelpIcons}
                    position="bottom"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Property Card for active address */}
      {property && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto">
            <PropertyCard
              property={property}
              onSave={handleSaveProperty}
              onClose={handleClearProperty}
              addressLabel={activeAddress?.label}
              isSaved={activeAddress?.isSaved}
            />
          </div>
        </div>
      )}

      {/* Unsupported City - Coming Soon */}
      {unsupportedCity && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-amber-800 text-lg">
                      {unsupportedCity.city}, {unsupportedCity.state} is coming soon!
                    </h3>
                  </div>
                  <p className="text-amber-700 text-sm mb-4">
                    We're expanding to {unsupportedCity.city}. Get notified when ready:
                  </p>

                  {waitlistSubmitted ? (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>You're on the list! We'll notify you when {unsupportedCity.city} launches.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlistSubmit} className="flex gap-2">
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                      >
                        Notify Me
                      </button>
                    </form>
                  )}

                  {unsupportedCity.waitlistCount > 0 && (
                    <p className="text-amber-600 text-sm mt-3">
                      {unsupportedCity.waitlistCount} {unsupportedCity.waitlistCount === 1 ? 'person' : 'people'} waiting for {unsupportedCity.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setUnsupportedCity(null)}
                  className="p-1 text-amber-400 hover:text-amber-600 hover:bg-amber-100 rounded ml-4"
                  title="Clear"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-amber-600 text-sm mt-4 pt-4 border-t border-amber-200">
                You can still ask general questions about {unsupportedCity.state} regulations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
