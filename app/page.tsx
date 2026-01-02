'use client';

import { useState, useCallback } from 'react';
import AddressBar from '../components/AddressBar';
import PropertyCard, { PropertyData } from '../components/PropertyCard';
import ChatMessages from '../components/ChatMessages';
import ChatInput from '../components/ChatInput';
import EmptyState from '../components/EmptyState';
import { ChatMessageProps } from '../components/ChatMessage';

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
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [unsupportedCity, setUnsupportedCity] = useState<UnsupportedCity | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleAddressSelect = useCallback(async (address: string, propertyData?: any) => {
    // Reset states
    setUnsupportedCity(null);
    setWaitlistSubmitted(false);

    // If propertyData is provided from AddressBar (Google Places)
    if (propertyData) {
      if (propertyData.supported === false) {
        setUnsupportedCity({
          city: propertyData.city,
          state: propertyData.state,
          jurisdictionId: propertyData.jurisdictionId,
          address: propertyData.address,
          waitlistCount: propertyData.waitlistCount || 0,
        });
        setProperty(null);
        return;
      }

      if (propertyData.property) {
        setProperty(propertyData.property);
        return;
      }
    }

    // Fallback: do our own lookup
    try {
      const res = await fetch(`/api/property/lookup?address=${encodeURIComponent(address)}`);
      const data = await res.json();

      if (data.success) {
        if (data.supported === false) {
          setUnsupportedCity({
            city: data.city,
            state: data.state,
            jurisdictionId: data.jurisdictionId,
            address: data.address,
            waitlistCount: data.waitlistCount || 0,
          });
          setProperty(null);
        } else if (data.property) {
          setProperty(data.property);
        }
      } else {
        // Still set basic address even if lookup fails
        setProperty({
          address: address,
          city: 'Cincinnati',
        });
      }
    } catch (error) {
      // Set basic address on error
      setProperty({
        address: address,
        city: 'Cincinnati',
      });
    }
  }, []);

  const handlePropertyLookup = useCallback((propertyData: any) => {
    // This is called by AddressBar after property lookup
    if (propertyData.supported === false) {
      setUnsupportedCity({
        city: propertyData.city,
        state: propertyData.state,
        jurisdictionId: propertyData.jurisdictionId,
        address: propertyData.address,
        waitlistCount: propertyData.waitlistCount || 0,
      });
      setProperty(null);
    } else if (propertyData.property) {
      setProperty(propertyData.property);
      setUnsupportedCity(null);
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
    if (!property) return;

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: property.address }),
      });

      if (res.ok) {
        console.log('Property saved');
      }
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  }, [property]);

  const handleClearProperty = useCallback(() => {
    setProperty(null);
    setUnsupportedCity(null);
  }, []);

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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          address: property?.address,
          propertyContext: property,
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
  }, [conversationId, property]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Address Bar */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <AddressBar
            onAddressSelect={handleAddressSelect}
            onPropertyLookup={handlePropertyLookup}
            placeholder="Enter an address or ask a question..."
          />
        </div>
      </div>

      {/* Property Card */}
      {property && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto">
            <PropertyCard
              property={property}
              onSave={handleSaveProperty}
              onClose={handleClearProperty}
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
                    <span className="text-2xl">🚧</span>
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
                    <p className="text-amber-600 text-sm mt-3 flex items-center gap-1">
                      <span>📊</span>
                      {unsupportedCity.waitlistCount} {unsupportedCity.waitlistCount === 1 ? 'person' : 'people'} waiting for {unsupportedCity.city}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClearProperty}
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
          <EmptyState onSuggestionClick={handleSuggestionClick} />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}
