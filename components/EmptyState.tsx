'use client';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-2">
        How can I help you today?
      </h1>
      <p className="text-gray-500 text-sm max-w-md">
        Enter an address above for property-specific answers.
      </p>
    </div>
  );
}
