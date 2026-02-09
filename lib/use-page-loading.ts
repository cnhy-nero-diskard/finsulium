'use client';

import { useStore } from '@/lib/store';

export function usePageLoading() {
  const { setLoading } = useStore();

  const showLoading = () => {
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  return { showLoading, hideLoading };
}

