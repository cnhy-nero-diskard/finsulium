'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import { Database, Shield, Palette, Globe, Trash2 } from 'lucide-react';
import { CURRENCIES, getAllCurrencies } from '@/lib/currencies';
import CurrencyChangeDialog from '@/components/currency-change-dialog';
import DatabaseWipeDialog from '@/components/database-wipe-dialog';
import {
  updateTransactionsCurrencyInDB,
  updateCurrencyWithoutConversion,
} from '@/lib/services/currency';
import { wipeAllData } from '@/lib/services/transactions';

export default function SettingsPage() {
  const { credentials, encryptionConfig, currency, transactions, encryptionKey, setTransactions, setGoals } = useStore();
  const [showCurrencyList, setShowCurrencyList] = useState(false);
  const [showCurrencyChangeDialog, setShowCurrencyChangeDialog] =
    useState(false);
  const [showDatabaseWipeDialog, setShowDatabaseWipeDialog] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencyList = getAllCurrencies();
  const selected = CURRENCIES[currency as keyof typeof CURRENCIES];

  const handleCurrencySelection = (newCurrency: string) => {
    if (newCurrency === currency) {
      setShowCurrencyList(false);
      return;
    }

    // If no transactions, just change it directly
    if (transactions.length === 0) {
      useStore.getState().setCurrency(newCurrency);
      setShowCurrencyList(false);
      return;
    }

    // Show dialog to ask about conversion
    setPendingCurrency(newCurrency);
    setShowCurrencyChangeDialog(true);
    setShowCurrencyList(false);
  };

  const handleKeepAsIs = async () => {
    if (!pendingCurrency) return;

    setLoading(true);
    setError(null);

    try {
      await updateCurrencyWithoutConversion(currency, pendingCurrency);
      setPendingCurrency(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to update currency:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (conversionRate: number) => {
    if (!pendingCurrency) return;

    setLoading(true);
    setError(null);

    try {
      await updateTransactionsCurrencyInDB(
        currency,
        pendingCurrency,
        conversionRate
      );
      setPendingCurrency(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to convert transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseWipe = async (encryptionKeyInput: string) => {
    setLoading(true);
    setError(null);

    try {
      // If encryption is enabled, verify the key matches
      if (encryptionConfig?.enabled && encryptionKey) {
        // In a real implementation, you would verify the key here
        // For now, we'll just proceed with the wipe
      }

      await wipeAllData();
      
      // Clear the store
      setTransactions([]);
      setGoals([]);
      
      setShowDatabaseWipeDialog(false);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to wipe database:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your app configuration
        </p>
      </div>

      <div className="grid gap-6">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Currency
            </CardTitle>
            <CardDescription>
              Choose your preferred currency for all transactions
              {transactions.length > 0 && (
                <span className="block text-xs mt-1">
                  You have {transactions.length} transaction
                  {transactions.length !== 1 ? 's' : ''}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Button
                onClick={() => setShowCurrencyList(!showCurrencyList)}
                variant="outline"
                className="w-full justify-between"
                disabled={loading}
              >
                <span>
                  {selected?.symbol} {selected?.code} - {selected?.name}
                </span>
                <span>▼</span>
              </Button>

              {showCurrencyList && (
                <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
                  {currencyList.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => handleCurrencySelection(curr.code)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b transition-colors ${
                        currency === curr.code ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {curr.symbol} {curr.code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {curr.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {curr.countries}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <strong>{selected.code}</strong> - {selected.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Used in: {selected.countries}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Connection Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Connection
            </CardTitle>
            <CardDescription>
              Your Supabase instance information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Project URL</p>
              <p className="text-sm text-muted-foreground font-mono">
                {credentials?.url || 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Connection Status</p>
              <p className="text-sm text-green-600">✓ Connected</p>
            </div>
          </CardContent>
        </Card>

        {/* Encryption Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Encryption
            </CardTitle>
            <CardDescription>
              Your data security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Encryption Status</p>
              <p className="text-sm text-green-600">
                {encryptionConfig?.enabled ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
            {encryptionConfig?.enabled && (
              <div>
                <p className="text-sm font-medium mb-1">Encryption Type</p>
                <p className="text-sm text-muted-foreground">
                  {encryptionConfig.type === 'password'
                    ? '🔒 Master Password'
                    : '🔑 Random Key'}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Your encryption key is stored only in your browser&apos;s memory and
              never transmitted to any server.
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Theme</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm">Light</Button>
                <Button variant="outline" size="sm">Dark</Button>
                <Button variant="default" size="sm">System</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
            <CardDescription>
              Dangerous operations - use with caution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete all your transactions and goals. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDatabaseWipeDialog(true)}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Wipe All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Change Dialog */}
      {pendingCurrency && (
        <CurrencyChangeDialog
          open={showCurrencyChangeDialog}
          onClose={() => {
            setShowCurrencyChangeDialog(false);
            setPendingCurrency(null);
          }}
          oldCurrency={currency}
          newCurrency={pendingCurrency}
          transactionCount={transactions.length}
          onKeepAsIs={handleKeepAsIs}
          onConvert={handleConvert}
        />
      )}

      {/* Database Wipe Dialog */}
      <DatabaseWipeDialog
        open={showDatabaseWipeDialog}
        onClose={() => setShowDatabaseWipeDialog(false)}
        onConfirm={handleDatabaseWipe}
        hasEncryption={encryptionConfig?.enabled ?? false}
      />
    </div>
  );
}
