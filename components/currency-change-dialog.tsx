'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CURRENCIES, type CurrencyCode } from '@/lib/currencies';
import { AlertCircle, Info } from 'lucide-react';

interface CurrencyChangeDialogProps {
  open: boolean;
  onClose: () => void;
  oldCurrency: string;
  newCurrency: string;
  transactionCount: number;
  onKeepAsIs: () => void;
  onConvert: (conversionRate: number) => void;
}

export default function CurrencyChangeDialog({
  open,
  onClose,
  oldCurrency,
  newCurrency,
  transactionCount,
  onKeepAsIs,
  onConvert,
}: CurrencyChangeDialogProps) {
  const [action, setAction] = useState<'keep' | 'convert' | null>(null);
  const [conversionRate, setConversionRate] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const oldCurrencyData = CURRENCIES[oldCurrency as CurrencyCode];
  const newCurrencyData = CURRENCIES[newCurrency as CurrencyCode];

  const handleKeepAsIs = () => {
    setLoading(true);
    try {
      onKeepAsIs();
      onClose();
      setAction(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = () => {
    setLoading(true);
    setError('');

    try {
      const rate = parseFloat(conversionRate);
      if (isNaN(rate) || rate <= 0) {
        setError('Please enter a valid conversion rate greater than 0');
        setLoading(false);
        return;
      }

      onConvert(rate);
      onClose();
      setAction(null);
      setConversionRate('1.0');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
            Update Currency
          </DialogTitle>
          <DialogDescription>
            You have {transactionCount} existing transaction
            {transactionCount !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="p-4 bg-blue-50 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {oldCurrencyData?.symbol || oldCurrency}
              </span>
              <span className="text-muted-foreground">{oldCurrency}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-2xl">
                {newCurrencyData?.symbol || newCurrency}
              </span>
              <span className="text-muted-foreground">{newCurrency}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {oldCurrencyData?.name} → {newCurrencyData?.name}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Option 1: Keep as is */}
            <div
              onClick={() => setAction('keep')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                action === 'keep'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="action"
                  value="keep"
                  checked={action === 'keep'}
                  onChange={() => setAction('keep')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium">Keep Past Transactions As Is</p>
                  <p className="text-sm text-muted-foreground">
                    Past {transactionCount} transaction
                    {transactionCount !== 1 ? 's will' : ' will'} remain in{' '}
                    <strong>{oldCurrency}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ℹ️ Useful if you were tracking a specific currency before
                  </p>
                </div>
              </div>
            </div>

            {/* Option 2: Convert */}
            <div
              onClick={() => setAction('convert')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                action === 'convert'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  name="action"
                  value="convert"
                  checked={action === 'convert'}
                  onChange={() => setAction('convert')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium">Convert All Transactions</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Convert {transactionCount} transaction
                    {transactionCount !== 1 ? 's' : ''} from {oldCurrency} to{' '}
                    {newCurrency}
                  </p>

                  {action === 'convert' && (
                    <div className="space-y-2">
                      <Label htmlFor="rate" className="text-xs">
                        Conversion Rate ({oldCurrency} → {newCurrency})
                      </Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          1 {oldCurrency} =
                        </span>
                        <Input
                          id="rate"
                          type="number"
                          step="0.001"
                          min="0"
                          value={conversionRate}
                          onChange={(e) => setConversionRate(e.target.value)}
                          placeholder="1.0"
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          {newCurrency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Example: If 1 USD = 0.92 EUR, enter 0.92
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg">
            <Info className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              This change affects how transactions are displayed in charts and
              reports. You can always change currency again later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          {action === 'keep' && (
            <Button onClick={handleKeepAsIs} disabled={loading}>
              {loading ? 'Processing...' : 'Keep As Is'}
            </Button>
          )}
          {action === 'convert' && (
            <Button onClick={handleConvert} disabled={loading}>
              {loading ? 'Converting...' : 'Convert'}
            </Button>
          )}
          {!action && (
            <Button disabled>
              Select an option
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
