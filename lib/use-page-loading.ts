'use client';

import { useLoading } from '@/lib/loading-context';

export function usePageLoading() {
  const { setIsLoading } = useLoading();

  const showLoading = () => {
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return { showLoading, hideLoading };
}

