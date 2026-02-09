'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useStore } from '@/lib/store';
import { createTag, createTransaction, updateTransaction } from '@/lib/services/transactions';
import type { Transaction } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import { generateRandomColor } from '@/lib/utils';

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

export default function TransactionModal({ open, onClose, transaction }: TransactionModalProps) {
  const { categories, tags, encryptionKey, addTransaction, updateTransaction: updateStore, addTag } = useStore();
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    description: '',
    mood: '' as '' | 'happy' | 'necessary' | 'impulse' | 'regret',
    notes: '',
    selectedTags: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagLoading, setTagLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount.toString(),
        type: transaction.type,
        date: transaction.date.split('T')[0],
        category_id: transaction.category_id,
        description: transaction.description || '',
        mood: transaction.mood || '',
        notes: transaction.notes || '',
        selectedTags: transaction.tags || [],
      });
    } else {
      // Reset form for new transaction
      setFormData({
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        category_id: '',
        description: '',
        mood: '',
        notes: '',
        selectedTags: [],
      });
    }
    setError('');
    setNewTagName('');
    setTagError('');
  }, [transaction, open]);

  const handleCreateTag = async () => {
    const rawName = newTagName.trim();
    if (!rawName) {
      setTagError('Please enter a tag name');
      return;
    }

    const existing = tags.find(
      (tag) => tag.name.toLowerCase() === rawName.toLowerCase()
    );

    if (existing) {
      setFormData((prev) => ({
        ...prev,
        selectedTags: prev.selectedTags.includes(existing.id)
          ? prev.selectedTags
          : [...prev.selectedTags, existing.id],
      }));
      setNewTagName('');
      setTagError('');
      return;
    }

    setTagLoading(true);
    setTagError('');

    try {
      const created = await createTag({
        name: rawName,
        color: generateRandomColor(),
      });
      addTag(created);
      setFormData((prev) => ({
        ...prev,
        selectedTags: [...prev.selectedTags, created.id],
      }));
      setNewTagName('');
    } catch (err: any) {
      setTagError(err.message || 'Failed to create tag');
    } finally {
      setTagLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        setLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Please select a category');
        setLoading(false);
        return;
      }

      const transactionData = {
        amount,
        type: formData.type,
        date: formData.date,
        category_id: formData.category_id,
        description: formData.description,
        mood: formData.mood || undefined,
        notes: formData.notes,
        tags: formData.selectedTags,
      };

      if (transaction) {
        // Update existing transaction
        const updated = await updateTransaction(transaction.id, transactionData, encryptionKey);
        updateStore(transaction.id, updated);
      } else {
        // Create new transaction
        const created = await createTransaction(transactionData as any, encryptionKey);
        addTransaction(created);
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const availableCategories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const moods = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'necessary', label: 'Necessary', emoji: '👍' },
    { value: 'impulse', label: 'Impulse', emoji: '🤔' },
    { value: 'regret', label: 'Regret', emoji: '😟' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Update your transaction details' : 'Log a new transaction'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                onClick={() => {
                  setFormData({ ...formData, type: 'income', category_id: '' });
                }}
                className="w-full"
              >
                Income
              </Button>
              <Button
                type="button"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                onClick={() => {
                  setFormData({ ...formData, type: 'expense', category_id: '' });
                }}
                className="w-full"
              >
                Expense
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="">Select a category</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="e.g., Grocery shopping at Walmart"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Mood (for expenses only) */}
          {formData.type === 'expense' && (
            <div>
              <Label>How do you feel about this expense?</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.value}
                    type="button"
                    variant={formData.mood === mood.value ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, mood: mood.value as any })}
                    className="flex flex-col h-auto py-2"
                  >
                    <span className="text-2xl mb-1">{mood.emoji}</span>
                    <span className="text-xs">{mood.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                placeholder="Add a tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                disabled={tagLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateTag}
                disabled={tagLoading}
              >
                {tagLoading ? 'Adding...' : 'Add'}
              </Button>
            </div>
            {tagError && (
              <p className="text-xs text-red-600 mt-1">{tagError}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  size="sm"
                  variant={formData.selectedTags.includes(tag.id) ? 'default' : 'outline'}
                  onClick={() => {
                    const isSelected = formData.selectedTags.includes(tag.id);
                    setFormData({
                      ...formData,
                      selectedTags: isSelected
                        ? formData.selectedTags.filter(t => t !== tag.id)
                        : [...formData.selectedTags, tag.id],
                    });
                  }}
                >
                  #{tag.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
