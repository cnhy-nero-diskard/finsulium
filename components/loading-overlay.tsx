'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { usePathname, useSearchParams } from 'next/navigation';

export function LoadingOverlay() {
  const { isLoading, setLoading } = useStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset loading state when route changes
  useEffect(() => {
    if (isLoading) {
      setLoading(false);
    }
  }, [pathname, searchParams, setLoading, isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500 animate-spin"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
