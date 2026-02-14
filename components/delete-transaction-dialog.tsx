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
import { AlertCircle, Trash2 } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currency: string;
  onConfirm: () => Promise<void>;
}

export default function DeleteTransactionDialog({
  open,
  onClose,
  transaction,
  currency,
  onConfirm,
}: DeleteTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setError('');
      onClose();
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Delete Transaction
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The transaction will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              ⚠️ You are about to permanently delete this transaction.
            </p>
          </div>

          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-600">Description</span>
              <span className="text-sm text-slate-900 font-semibold">
                {transaction.description || '(Untitled)'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-600">Amount</span>
              <span className="text-sm text-slate-900 font-semibold">
                {formatCurrency(transaction.amount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-600">Date</span>
              <span className="text-sm text-slate-900">
                {new Date(transaction.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
