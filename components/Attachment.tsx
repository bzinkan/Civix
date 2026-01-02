'use client';

interface AttachmentProps {
  name: string;
  type: string;
  url: string;
  description?: string;
}

export default function Attachment({ name, type, url, description }: AttachmentProps) {
  const getIcon = () => {
    if (type === 'pdf' || name.endsWith('.pdf')) {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          <path d="M8 12h2v2H8zm0 3h2v2H8zm3-3h2v5h-2zm3 2h2v3h-2z" />
        </svg>
      );
    }
    if (type === 'doc' || type === 'docx' || name.endsWith('.doc') || name.endsWith('.docx')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          <path d="M8 12h8v1H8zm0 2h8v1H8zm0 2h5v1H8z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">{name}</div>
        {description && (
          <div className="text-xs text-gray-500 truncate">{description}</div>
        )}
      </div>
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
}
