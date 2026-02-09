'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { initializeSupabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  Plus, 
  TrendingUp, 
  Target, 
  Settings,
  LogOut,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOnboarded, credentials, clearCredentials, setLoading } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (!isOnboarded || !credentials) {
      router.push('/');
      return;
    }

    // Initialize Supabase with stored credentials
    try {
      initializeSupabase(credentials);
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      router.push('/');
    }
  }, [isOnboarded, credentials, router]);

  const handleLogout = () => {
    setLoading(true);
    clearCredentials();
    router.push('/');
  };

  if (!mounted || !isOnboarded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">FINSULIUM</h1>
          <p className="text-xs text-muted-foreground mt-1">Privacy-First Finance</p>
        </div>

        <nav className="flex-1 px-3">
          <div className="space-y-1">
            <Link 
              href="/dashboard" 
              onClick={() => {
                if (pathname !== '/dashboard') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link 
              href="/dashboard/transactions" 
              onClick={() => {
                if (pathname !== '/dashboard/transactions') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Transactions
              </Button>
            </Link>

            <Link 
              href="/dashboard/analytics" 
              onClick={() => {
                if (pathname !== '/dashboard/analytics') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>

            <Link 
              href="/dashboard/goals" 
              onClick={() => {
                if (pathname !== '/dashboard/goals') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Goals
              </Button>
            </Link>

            <Link 
              href="/dashboard/export" 
              onClick={() => {
                if (pathname !== '/dashboard/export') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </Link>

            <Link 
              href="/dashboard/settings" 
              onClick={() => {
                if (pathname !== '/dashboard/settings') setLoading(true);
              }}
            >
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
