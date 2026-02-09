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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useStore } from '@/lib/store';
import { createTransaction } from '@/lib/services/transactions';
import type { Transaction } from '@/lib/types';
import { AlertCircle, Upload, Plus, Trash2, Check } from 'lucide-react';

interface BulkTransactionRow {
  date: string;
  type: 'income' | 'expense';
  amount: string;
  category: string;
  description: string;
  mood?: string;
}

interface BulkTransactionImportProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkTransactionImport({
  open,
  onClose,
}: BulkTransactionImportProps) {
  const { categories, addTransaction, encryptionKey, encryptionConfig } = useStore();
  const [importMode, setImportMode] = useState<'table' | 'csv'>('table');
  const [rows, setRows] = useState<BulkTransactionRow[]>([
    {
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      mood: '',
    },
  ]);
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const addRow = () => {
    setRows([
      ...rows,
      {
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        mood: '',
      },
    ]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = <K extends keyof BulkTransactionRow>(
    index: number,
    field: K,
    value: BulkTransactionRow[K]
  ) => {
    setRows(prev =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const parseCSV = (text: string): BulkTransactionRow[] => {
    const lines = text.trim().split('\n');
    const parsed: BulkTransactionRow[] = [];

    lines.forEach((line, index) => {
      if (index === 0) return; // Skip header
      const [date, type, amount, category, description, mood] = line.split(',').map(s => s.trim());

      if (date && amount) {
        parsed.push({
          date: date || new Date().toISOString().split('T')[0],
          type: (type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          amount: amount || '',
          category: category || '',
          description: description || '',
          mood: mood || '',
        });
      }
    });

    return parsed;
  };

  const handleCSVImport = () => {
    try {
      const parsed = parseCSV(csvText);
      if (parsed.length === 0) {
        setError('No valid rows found in CSV');
        return;
      }
      setRows(parsed);
      setCsvText('');
      setImportMode('table');
      setError('');
    } catch (err: any) {
      setError('Failed to parse CSV: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError('No valid rows found in file');
          return;
        }
        setRows(parsed);
        setError('');
      } catch (err: any) {
        setError('Failed to parse file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccessCount(0);

    // Check if encryption is enabled but key is not loaded
    if (encryptionConfig?.enabled && !encryptionKey) {
      setError('Encryption key not loaded. Please unlock your encryption first.');
      setLoading(false);
      return;
    }

    let created = 0;

    try {
      for (const row of rows) {
        // Validate
        const amount = parseFloat(row.amount);
        if (isNaN(amount) || amount <= 0) {
          console.warn(`Skipping row with invalid amount: ${row.amount}`);
          continue;
        }

        if (!row.category) {
          console.warn(`Skipping row with missing category`);
          continue;
        }

        // Find category ID
        const category = categories.find(c => 
          c.name.toLowerCase() === row.category.toLowerCase()
        );

        if (!category) {
          console.warn(`Category not found: ${row.category}`);
          continue;
        }

        // Create transaction
        const newTransaction = await createTransaction(
          {
            amount,
            type: row.type,
            date: row.date,
            category_id: category.id,
            description: row.description || '',
            mood: row.mood ? (row.mood as any) : undefined,
            tags: [],
            notes: '',
          },
          encryptionKey
        );

        addTransaction(newTransaction);
        created++;
      }

      setSuccessCount(created);
      
      if (created > 0) {
        setTimeout(() => {
          setRows([
            {
              date: new Date().toISOString().split('T')[0],
              type: 'expense',
              amount: '',
              category: '',
              description: '',
              mood: '',
            },
          ]);
          setSuccessCount(0);
          onClose();
        }, 2000);
      } else {
        setError('No valid transactions were created');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import transactions');
    } finally {
      setLoading(false);
    }
  };

  const categoryNames = categories.map(c => c.name);
  const validRows = rows.filter(r => r.amount && r.category);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Bulk Import Transactions
          </DialogTitle>
          <DialogDescription>
            Add multiple transactions quickly. Use the table for fast entry or CSV for batch imports.
          </DialogDescription>
        </DialogHeader>

        {successCount > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700">
              Successfully created {successCount} transaction{successCount !== 1 ? 's' : ''}!
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={importMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImportMode('table')}
          >
            Quick Entry
          </Button>
          <Button
            variant={importMode === 'csv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setImportMode('csv')}
          >
            CSV Import
          </Button>
        </div>

        {/* CSV Mode */}
        {importMode === 'csv' && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Upload CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Or Paste CSV Data</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Format: date, type, amount, category, description, mood
              </p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="2026-02-08, expense, 50.00, Food, Lunch, happy
2026-02-07, income, 1000.00, Salary, Monthly payment, necessary"
                className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none"
              />
            </div>

            <Button onClick={handleCSVImport} className="w-full">
              Parse CSV
            </Button>
          </div>
        )}

        {/* Table Mode */}
        {importMode === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Category</th>
                    <th className="text-left py-2 px-2">Description</th>
                    <th className="text-left py-2 px-2">Mood</th>
                    <th className="text-center py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">
                        <Input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(index, 'date', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.type}
                          onChange={(e) =>
                            updateRow(
                              index,
                              'type',
                              e.target.value === 'income' ? 'income' : 'expense'
                            )
                          }
                          className="h-8 px-2 border rounded text-xs"
                        >
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.amount}
                          onChange={(e) => updateRow(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.category}
                          onChange={(e) => updateRow(index, 'category', e.target.value)}
                          className="h-8 px-2 border rounded text-xs"
                        >
                          <option value="">Select Category</option>
                          {categoryNames.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="text"
                          value={row.description}
                          onChange={(e) => updateRow(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={row.mood || ''}
                          onChange={(e) => updateRow(index, 'mood', e.target.value)}
                          className="h-8 px-2 border rounded text-xs"
                        >
                          <option value="">None</option>
                          <option value="happy">😊 Happy</option>
                          <option value="necessary">👍 Necessary</option>
                          <option value="impulse">🤔 Impulse</option>
                          <option value="regret">😟 Regret</option>
                        </select>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              onClick={addRow}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-between">
          <div className="text-sm text-muted-foreground">
            {validRows.length} of {rows.length} rows ready
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={validRows.length === 0 || loading}
              className="gap-2"
            >
              {loading ? 'Importing...' : `Import ${validRows.length} Transactions`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
