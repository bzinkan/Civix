'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the Report an Issue tool
    router.replace('/tools/report');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Redirecting to Report an Issue...</div>
    </div>
  );
}
