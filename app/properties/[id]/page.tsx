'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PropertyCard, { PropertyData } from '../../../components/PropertyCard';
import ChatMessages from '../../../components/ChatMessages';
import ChatInput from '../../../components/ChatInput';
import { ChatMessageProps } from '../../../components/ChatMessage';

interface SavedProperty {
  id: string;
  address: string;
  nickname: string | null;
  zoneCode: string | null;
  zoneName: string | null;
  zoneType: string | null;
  propertyData: PropertyData | null;
  conversations: Array<{
    id: string;
    messages: Array<{
      role: string;
      content: string;
      citations?: any;
      attachments?: any;
      createdAt: string;
    }>;
  }>;
}

export default function PropertyWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<SavedProperty | null>(null);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`);
      const data = await res.json();

      if (data.success && data.property) {
        setProperty(data.property);

        // Build property data for PropertyCard
        const propData: PropertyData = {
          address: data.property.address,
          zone: data.property.zoneCode || undefined,
          zoneName: data.property.zoneName || undefined,
          zoneType: data.property.zoneType || undefined,
          ...data.property.propertyData,
        };
        setPropertyData(propData);

        // Load existing messages from the first conversation
        if (data.property.conversations && data.property.conversations.length > 0) {
          const conv = data.property.conversations[0];
          setConversationId(conv.id);

          const loadedMessages: ChatMessageProps[] = conv.messages.map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            citations: msg.citations,
            attachments: msg.attachments,
            createdAt: msg.createdAt,
          }));
          setMessages(loadedMessages);
        }
      } else {
        // Property not found
        router.push('/properties');
      }
    } catch (error) {
      console.error('Failed to fetch property:', error);
      router.push('/properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    // Add user message to UI immediately
    const userMessage: ChatMessageProps = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          propertyId,
          address: property?.address,
          propertyContext: propertyData,
        }),
      });

      const data = await res.json();
      console.log('[Property Chat] API response:', data);

      if (!res.ok) {
        console.error('[Property Chat] API error status:', res.status);
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add assistant message
      const responseContent = data.answer || data.message || data.error || 'Sorry, I could not process your request.';
      console.log('[Property Chat] Response content:', responseContent.substring(0, 100));

      const assistantMessage: ChatMessageProps = {
        role: 'assistant',
        content: responseContent,
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
      setIsSending(false);
    }
  }, [conversationId, propertyId, property, propertyData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading property...</div>
      </div>
    );
  }

  if (!property || !propertyData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Property not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Property Card - Always visible, no close button */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto">
          <PropertyCard
            property={propertyData}
            showCloseButton={false}
            isSaved={true}
          />
        </div>
      </div>

      {/* Chat Area */}
      {messages.length === 0 ? (
        /* No messages - positioned like ChatGPT (upper-middle area) */
        <div className="flex-1 flex flex-col items-center pt-[10vh] px-4">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              How can I help you today?
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              Ask questions about permits, zoning, and regulations for this property.
            </p>
            <ChatInput
              onSend={handleSendMessage}
              disabled={isSending}
              placeholder={`Ask about ${property.nickname || property.address}...`}
              centered
            />
          </div>
        </div>
      ) : (
        /* Active conversation - standard layout */
        <>
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages messages={messages} isLoading={isSending} />
          </div>
          <ChatInput
            onSend={handleSendMessage}
            disabled={isSending}
            placeholder={`Ask about ${property.nickname || property.address}...`}
          />
        </>
      )}
    </div>
  );
}
