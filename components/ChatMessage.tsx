'use client';

import { useState } from 'react';
import Citation from './Citation';
import Attachment from './Attachment';

export interface MessageCitation {
  code: string;
  title?: string;
  excerpt?: string;
  url?: string;
}

export interface MessageAttachment {
  name: string;
  type: string;
  url: string;
  description?: string;
}

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: MessageCitation[];
  attachments?: MessageAttachment[];
  createdAt?: string;
}

export default function ChatMessage({ role, content, citations, attachments, createdAt }: ChatMessageProps) {
  const [showCitations, setShowCitations] = useState(false);

  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-xs text-gray-500">Civix</span>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
          }`}
        >
          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, i) => (
              <p key={i} className={`${i > 0 ? 'mt-2' : ''} ${isUser ? 'text-white' : 'text-gray-800'}`}>
                {line}
              </p>
            ))}
          </div>

          {/* Citations Section */}
          {!isUser && citations && citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>{showCitations ? 'Hide' : 'Show'} Sources ({citations.length})</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showCitations ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCitations && (
                <div className="mt-2 space-y-2">
                  {citations.map((citation, index) => (
                    <Citation key={index} {...citation} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          {!isUser && attachments && attachments.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Documents</span>
              </div>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <Attachment key={index} {...attachment} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {createdAt && (
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
