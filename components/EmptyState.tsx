'use client';

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  'Do I need a permit to build a deck?',
  'What are the fence height limits?',
  'How do I open a restaurant in Cincinnati?',
  'Can I run a business from home?',
];

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">CIVIX</h1>
        <p className="text-gray-500">Your local regulatory assistant</p>
      </div>

      <div className="w-full max-w-md">
        <p className="text-gray-600 mb-4">Try asking:</p>
        <div className="space-y-2">
          {SUGGESTIONS.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-gray-700"
            >
              <span className="text-blue-500 mr-2">&bull;</span>
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-400">
        <p>Enter an address for property-specific answers</p>
      </div>
    </div>
  );
}
