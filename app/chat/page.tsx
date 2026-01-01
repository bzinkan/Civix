'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
}

interface ExtractedValues {
  lot_width_ft?: number;
  lot_depth_ft?: number;
  project_footprint_sqft?: number;
  front_setback_ft?: number;
  rear_setback_ft?: number;
  building_height_ft?: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [address, setAddress] = useState(searchParams.get('address') || '');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedValues | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle initial prompt from URL
  useEffect(() => {
    const prompt = searchParams.get('prompt');
    const addressParam = searchParams.get('address');

    if (addressParam) {
      setAddress(addressParam);
    }

    if (prompt) {
      // Add welcome message with prompt context
      const contextMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `I can help you with questions about ${prompt.replace(/\+/g, ' ')}. ${addressParam ? `I see you're asking about ${addressParam}.` : 'Enter an address above for location-specific info.'} What would you like to know?`,
        timestamp: new Date()
      };
      setMessages([contextMessage]);
    }
  }, [searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && pendingFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: pendingFiles.map(f => f.name)
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('message', input);
      if (address) formData.append('address', address);

      pendingFiles.forEach((file, i) => {
        formData.append(`file${i}`, file);
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          address: address || undefined,
          attachments: pendingFiles.length > 0 ? await Promise.all(
            pendingFiles.map(async (file) => ({
              name: file.name,
              type: file.type,
              data: await fileToBase64(file)
            }))
          ) : []
        })
      });

      const data = await response.json();

      // Handle different response types
      if (data.type === 'extraction') {
        setExtractedData(data.extracted_values);
        const extractionMessage: Message = {
          id: Date.now().toString() + '-extract',
          role: 'assistant',
          content: `I extracted these measurements from your document:\n\n${formatExtractedData(data.extracted_values)}\n\n${data.notes || ''}\n\nPlease confirm these values are correct, then I can run the compliance check.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, extractionMessage]);
      } else if (data.response) {
        const assistantMessage: Message = {
          id: Date.now().toString() + '-response',
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else if (data.message) {
        const assistantMessage: Message = {
          id: Date.now().toString() + '-msg',
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

      setPendingFiles([]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatExtractedData = (data: ExtractedValues): string => {
    const lines = [];
    if (data.lot_width_ft) lines.push(`• Lot Width: ${data.lot_width_ft} ft`);
    if (data.lot_depth_ft) lines.push(`• Lot Depth: ${data.lot_depth_ft} ft`);
    if (data.project_footprint_sqft) lines.push(`• Project Footprint: ${data.project_footprint_sqft} sq ft`);
    if (data.front_setback_ft) lines.push(`• Front Setback: ${data.front_setback_ft} ft`);
    if (data.rear_setback_ft) lines.push(`• Rear Setback: ${data.rear_setback_ft} ft`);
    if (data.building_height_ft) lines.push(`• Building Height: ${data.building_height_ft} ft`);
    lines.push(`\nConfidence: ${data.confidence}`);
    return lines.join('\n');
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    setPendingFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <h1 className="text-xl font-bold">Civix Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Property:</span>
            <input
              type="text"
              className="input w-64"
              placeholder="Enter address for context..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 card overflow-y-auto mb-4 ${dragActive ? 'border-2 border-blue-500 bg-blue-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-bold mb-2">Ask me anything about permits, zoning, or regulations</h2>
            <p className="text-gray-500 mb-6">
              You can also upload site plans or documents for compliance checking
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Do I need a permit for a fence?',
                'What are the setback requirements?',
                'Can I run a daycare from home?',
                'Is this address in a historic district?'
              ].map((example, i) => (
                <button
                  key={i}
                  onClick={() => setInput(example)}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {message.attachments.map((name, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-white/20 rounded">
                          📎 {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse">●</div>
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {dragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-100/80 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              Drop files here to upload
            </div>
          </div>
        )}
      </div>

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {pendingFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm">📎 {file.name}</span>
              <button onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Data Confirmation */}
      {extractedData && (
        <div className="card mb-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Extracted Values Ready</h3>
              <p className="text-sm text-gray-600">Confirm the values above are correct</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInput('Yes, run the compliance check');
                  setExtractedData(null);
                }}
                className="button"
              >
                ✓ Confirm & Check
              </button>
              <button
                onClick={() => setExtractedData(null)}
                className="button-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="button-secondary p-3"
            title="Upload document"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
          />
          <input
            type="text"
            className="input flex-1"
            placeholder="Ask anything about permits, zoning, or regulations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="button"
            disabled={loading || (!input.trim() && pendingFiles.length === 0)}
          >
            Send ➤
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          📎 Drag & drop files, paste images, or click the attachment button
        </p>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chat...</div>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
