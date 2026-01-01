'use client';

import { useState, useRef, useEffect } from 'react';
import type { LocationData } from './location-input';

interface Source {
  citation: string;
  title: string;
  chapter: string;
  section: string | null;
  similarity: number;
  url: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  jurisdiction: {
    id: string;
    name: string;
    state: string;
  };
  onReset?: () => void;
  conversationId?: string; // For loading existing conversations
}

export default function ChatInterface({ jurisdiction, onReset, conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load existing conversation if conversationId is provided
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to load conversation');

      const data = await response.json();
      setMessages(data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        sources: msg.sources,
        timestamp: new Date(msg.createdAt),
      })));
    } catch (err: any) {
      console.error('Error loading conversation:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ordinances/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          jurisdictionId: jurisdiction.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If user is logged in and has a conversation ID, save to database
      // This will be implemented in the API endpoint
      if (conversationId) {
        await saveMessages(conversationId, [userMessage, assistantMessage]);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to process question');
      // Remove the user message if the request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessages = async (convId: string, msgs: ChatMessage[]) => {
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: msgs }),
      });
    } catch (err) {
      console.error('Error saving messages:', err);
      // Don't show error to user - this is background operation
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-lg">
            {jurisdiction.name}, {jurisdiction.state}
          </h2>
          <p className="text-sm text-gray-600">
            Ask questions about local ordinances
          </p>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:underline"
          >
            Change Location
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4 min-h-[400px] max-h-[600px] overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">👋 Start a conversation</p>
            <p className="text-sm">
              Ask any question about {jurisdiction.name} ordinances
            </p>
            <div className="mt-6 text-left max-w-md mx-auto space-y-2">
              <p className="text-sm font-semibold text-gray-700">Example questions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Can I build a fence in my front yard?</li>
                <li>• What are the noise ordinance rules?</li>
                <li>• Do I need a permit for a shed?</li>
                <li>• What are the parking regulations?</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Sources (only for assistant messages) */}
                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-sm font-semibold mb-2 text-gray-700">
                        Sources ({message.sources.length})
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div key={idx} className="text-sm bg-white rounded p-2 text-gray-800">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-blue-600">
                                {source.citation}
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {source.similarity}% match
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">{source.title}</div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                              >
                                View source →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs mt-2 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-bounce">●</div>
                    <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</div>
                    <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about ordinances..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Usage info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          💡 Ask follow-up questions to dive deeper into the regulations
        </p>
      </div>
    </div>
  );
}
