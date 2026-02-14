'use client';

import React, { useState, useMemo } from 'react';
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
import { createTransaction, batchCreateTransactions } from '@/lib/services/transactions';
import type { Transaction } from '@/lib/types';
import { AlertCircle, Upload, Plus, Trash2, Check, Eye, Edit2, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsP, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [mode, setMode] = useState<'entry' | 'preview'>('entry');
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('');
  const [dateRangeTo, setDateRangeTo] = useState<string>('');
  const [timelineGranularity, setTimelineGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Calculate metrics for preview
  const metrics = useMemo(() => {
    let validRows = rows.filter(r => r.amount && !isNaN(parseFloat(r.amount)));
    
    // Apply date range filter
    if (dateRangeFrom || dateRangeTo) {
      validRows = validRows.filter(r => {
        const transactionDate = new Date(r.date);
        if (dateRangeFrom) {
          const fromDate = new Date(dateRangeFrom);
          if (transactionDate < fromDate) return false;
        }
        if (dateRangeTo) {
          const toDate = new Date(dateRangeTo);
          toDate.setHours(23, 59, 59, 999);
          if (transactionDate > toDate) return false;
        }
        return true;
      });
    }
    
    const totalIncome = validRows
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const totalExpenses = validRows
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const net = totalIncome - totalExpenses;
    
    // Category breakdown
    const categoryBreakdown: Record<string, { amount: number; type: 'income' | 'expense' }> = {};
    validRows.forEach(r => {
      if (!r.category) return;
      if (!categoryBreakdown[r.category]) {
        categoryBreakdown[r.category] = { amount: 0, type: r.type };
      }
      categoryBreakdown[r.category].amount += parseFloat(r.amount);
    });
    
    // Top contributors
    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([name, data]) => ({
      name,
      amount: data.amount,
      type: data.type,
    }));
    
    const incomeContributors = categoryBreakdownArray
      .filter(c => c.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(c => ({
        ...c,
        percentage: totalIncome > 0 ? ((c.amount / totalIncome) * 100).toFixed(1) : '0.0',
      }));
    
    const expenseContributors = categoryBreakdownArray
      .filter(c => c.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(c => ({
        ...c,
        percentage: totalExpenses > 0 ? ((c.amount / totalExpenses) * 100).toFixed(1) : '0.0',
      }));
    
    // Timeline data aggregation
    const timelineData: Record<string, { income: number; expenses: number; date: string }> = {};
    validRows.forEach(r => {
      const date = new Date(r.date);
      let key: string;
      
      switch (timelineGranularity) {
        case 'daily':
          key = r.date;
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!timelineData[key]) {
        timelineData[key] = { income: 0, expenses: 0, date: key };
      }
      
      const amount = parseFloat(r.amount);
      if (r.type === 'income') {
        timelineData[key].income += amount;
      } else {
        timelineData[key].expenses += amount;
      }
    });
    
    const timelineArray = Object.values(timelineData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        date: timelineGranularity === 'monthly' 
          ? item.date 
          : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: item.income,
        expenses: item.expenses,
        net: item.income - item.expenses,
        fullDate: item.date,
      }));
    
    return {
      totalIncome,
      totalExpenses,
      net,
      count: validRows.length,
      categoryBreakdown: categoryBreakdownArray,
      incomeContributors,
      expenseContributors,
      timelineArray,
    };
  }, [rows, dateRangeFrom, dateRangeTo, timelineGranularity]);

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
    if (lines.length < 2) return [];
    
    const parsed: BulkTransactionRow[] = [];

    // Parse header row to find column indices
    const headerLine = lines[0];
    const headers = headerLine.split(',').map((h, idx) => ({ 
      name: h.trim().toLowerCase(), 
      index: idx 
    }));

    // Find indices for each field (support multiple header variations)
    const dateIdx = headers.find(h => h.name === 'date' || h.name === 'transaction date')?.index ?? 0;
    const typeIdx = headers.find(h => h.name === 'type' || h.name === 'transaction type')?.index ?? 1;
    const amountIdx = headers.find(h => h.name === 'amount' || h.name === 'transaction amount')?.index ?? 2;
    const categoryIdx = headers.find(h => h.name === 'category' || h.name === 'transaction category')?.index ?? 3;
    const descIdx = headers.find(h => h.name === 'description' || h.name === 'notes')?.index ?? 4;
    const moodIdx = headers.find(h => h.name === 'mood')?.index ?? -1;

    // Skip header, parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue; // Skip empty lines

      const cols = line.split(',').map(s => s.trim());
      const date = cols[dateIdx] || '';
      const type = cols[typeIdx] || '';
      const amount = cols[amountIdx] || '';
      const category = cols[categoryIdx] || '';
      const description = cols[descIdx] || '';
      const mood = moodIdx >= 0 ? cols[moodIdx] : '';

      if (date && amount) {
        // Parse date - handle formats like "04 23 2024" or "2024-04-23"
        let parsedDate = date;
        if (date.includes(' ') && date.split(' ').length === 3) {
          // Format: "MM DD YYYY" or "DD MM YYYY"
          const parts = date.split(' ');
          const m = parseInt(parts[0]);
          const d = parseInt(parts[1]);
          const y = parseInt(parts[2]);
          // Assume MM DD YYYY format
          parsedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }

        parsed.push({
          date: parsedDate || new Date().toISOString().split('T')[0],
          type: (type && type.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          amount: amount || '',
          category: category || '',
          description: description || '',
          mood: mood || '',
        });
      }
    }

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
    let skipped = 0;
    const skipReasons: Record<string, number> = {
      'Invalid amount': 0,
      'Missing category': 0,
      'Category not found': 0,
    };

    try {
      // Validate and prepare transactions for batch insert
      const validTransactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[] = [];

      for (const row of rows) {
        // Validate amount
        const amount = parseFloat(row.amount);
        if (isNaN(amount) || amount <= 0) {
          console.warn(`Skipping row with invalid amount: ${row.amount}`);
          skipped++;
          skipReasons['Invalid amount']++;
          continue;
        }

        if (!row.category) {
          console.warn(`Skipping row with missing category`);
          skipped++;
          skipReasons['Missing category']++;
          continue;
        }

        // Find category ID
        const category = categories.find(c => 
          c.name.toLowerCase() === row.category.toLowerCase()
        );

        if (!category) {
          console.warn(`Category not found: ${row.category}`);
          skipped++;
          skipReasons['Category not found']++;
          continue;
        }

        // Add to valid transactions array
        validTransactions.push({
          amount,
          type: row.type,
          date: row.date,
          category_id: category.id,
          description: row.description || '',
          mood: row.mood ? (row.mood as any) : undefined,
          tags: [],
          notes: '',
        });
      }

      // Batch insert all valid transactions (much faster!)
      if (validTransactions.length > 0) {
        const newTransactions = await batchCreateTransactions(
          validTransactions,
          encryptionKey
        );

        // Add all transactions to store
        newTransactions.forEach(t => addTransaction(t));
        created = newTransactions.length;
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
          setMode('entry');
          onClose();
        }, 2000);
      } else {
        // Build detailed error message
        const reasons = Object.entries(skipReasons)
          .filter(([_, count]) => count > 0)
          .map(([reason, count]) => `${count} × ${reason}`)
          .join(', ');
        setError(`No valid transactions were created. Skipped ${skipped} transaction(s): ${reasons}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode('entry');
    setEditingIndex(null);
    setError('');
    onClose();
  };

  const categoryNames = categories.map(c => c.name);
  const validRows = rows.filter(r => r.amount && r.category);

  // Calculate validation issues
  const validationIssues = useMemo(() => {
    const issues: Array<{ row: number; issue: string; category?: string }> = [];
    const missingCategories = new Set<string>();

    rows.forEach((row, index) => {
      // Check amount
      const amount = parseFloat(row.amount);
      if (!row.amount || isNaN(amount) || amount <= 0) {
        issues.push({ row: index + 1, issue: 'Invalid or missing amount' });
      }

      // Check category
      if (!row.category) {
        issues.push({ row: index + 1, issue: 'Missing category' });
      } else {
        const category = categories.find(c => 
          c.name.toLowerCase() === row.category.toLowerCase()
        );
        if (!category) {
          issues.push({ 
            row: index + 1, 
            issue: 'Category not found', 
            category: row.category 
          });
          missingCategories.add(row.category);
        }
      }
    });

    return { issues, missingCategories: Array.from(missingCategories) };
  }, [rows, categories]);

  const handleProceedToPreview = () => {
    if (validRows.length === 0) {
      setError('Please add at least one valid transaction');
      return;
    }
    setError('');
    setMode('preview');
  };

  const handleBackToEntry = () => {
    setMode('entry');
    setEditingIndex(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {mode === 'entry' ? (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Bulk Import Transactions
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Preview & Confirm Import
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'entry' 
              ? 'Add multiple transactions quickly. Use the table for fast entry or CSV for batch imports.'
              : 'Review your transactions, check the metrics, and make any necessary edits before importing.'
            }
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

        {/* ENTRY MODE */}
        {mode === 'entry' && (
          <>
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
          </>
        )}

        {/* PREVIEW MODE */}
        {mode === 'preview' && (
          <div className="space-y-6">
            {/* Validation Warnings */}
            {validationIssues.issues.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center text-amber-700">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Validation Issues ({validationIssues.issues.length})
                  </CardTitle>
                  <CardDescription>
                    These transactions will be skipped during import
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {validationIssues.missingCategories.length > 0 && (
                    <div className="p-3 bg-white rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-900 mb-2">
                        Categories not found in your account:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {validationIssues.missingCategories.map((cat, idx) => (
                          <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 mt-2">
                        💡 Tip: Create these categories in Settings before importing, or edit the transaction categories below.
                      </p>
                    </div>
                  )}
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationIssues.issues.slice(0, 10).map((issue, idx) => (
                      <div key={idx} className="text-xs text-amber-700 flex items-start gap-2">
                        <span className="font-medium">Row {issue.row}:</span>
                        <span>{issue.issue}</span>
                        {issue.category && (
                          <span className="font-medium">"{issue.category}"</span>
                        )}
                      </div>
                    ))}
                    {validationIssues.issues.length > 10 && (
                      <p className="text-xs text-amber-600 italic">
                        ...and {validationIssues.issues.length - 10} more issues
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Date Range Filter */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filter by Date Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date-from" className="text-xs mb-2 block">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateRangeFrom}
                      onChange={(e) => setDateRangeFrom(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs mb-2 block">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateRangeTo}
                      onChange={(e) => setDateRangeTo(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                {(dateRangeFrom || dateRangeTo) && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    Showing {metrics.count} transaction{metrics.count !== 1 ? 's' : ''} 
                    {dateRangeFrom && ` from ${dateRangeFrom}`}
                    {dateRangeFrom && dateRangeTo && ' to '}
                    {dateRangeTo && `${dateRangeTo}`}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center text-green-700">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Total Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-700">{metrics.totalIncome.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className={`border-red-200 bg-red-50`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium flex items-center text-red-700`}>
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-700">{metrics.totalExpenses.toFixed(2)}</p>
                </CardContent>
              </Card>

              <Card className={metrics.net >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm font-medium flex items-center ${metrics.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Net Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${metrics.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {metrics.net >= 0 ? '+' : ''}{metrics.net.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Contributors Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Income Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center text-green-700">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Top Income Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.incomeContributors.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.incomeContributors.map((contributor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{idx + 1}. {contributor.name}</p>
                            <div className="w-full bg-green-100 rounded-full h-2 mt-1">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${contributor.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-bold text-green-700">{contributor.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{contributor.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No income transactions</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Expense Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center text-red-700">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Top Expense Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.expenseContributors.length > 0 ? (
                    <div className="space-y-3">
                      {metrics.expenseContributors.map((contributor, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{idx + 1}. {contributor.name}</p>
                            <div className="w-full bg-red-100 rounded-full h-2 mt-1">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${contributor.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-bold text-red-700">{contributor.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{contributor.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No expense transactions</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Timeline Graph */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Transaction Timeline
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={timelineGranularity === 'daily' ? 'default' : 'outline'}
                      onClick={() => setTimelineGranularity('daily')}
                      className="h-7 text-xs"
                    >
                      Daily
                    </Button>
                    <Button
                      size="sm"
                      variant={timelineGranularity === 'weekly' ? 'default' : 'outline'}
                      onClick={() => setTimelineGranularity('weekly')}
                      className="h-7 text-xs"
                    >
                      Weekly
                    </Button>
                    <Button
                      size="sm"
                      variant={timelineGranularity === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setTimelineGranularity('monthly')}
                      className="h-7 text-xs"
                    >
                      Monthly
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {metrics.timelineArray.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={metrics.timelineArray}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                        formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
                      />
                      <Legend />
                      <Bar dataKey="income" stackId="a" fill="#22c55e" name="Income" />
                      <Bar dataKey="expenses" stackId="a" fill="#ef4444" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    No transactions in the selected date range
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bar Chart - Income vs Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Income vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: 'Income', amount: metrics.totalIncome, fill: '#22c55e' },
                      { name: 'Expenses', amount: metrics.totalExpenses, fill: '#ef4444' },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="amount">
                        {[
                          { name: 'Income', amount: metrics.totalIncome, fill: '#22c55e' },
                          { name: 'Expenses', amount: metrics.totalExpenses, fill: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart - Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <PieChart className="w-4 h-4 mr-2" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <RechartsP>
                      <Pie
                        data={metrics.categoryBreakdown}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${entry.amount.toFixed(0)}`}
                      >
                        {metrics.categoryBreakdown.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.type === 'income' ? '#22c55e' : '#ef4444'}
                            opacity={0.8 - (index * 0.1)}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsP>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Transaction List with Edit/Delete */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Transaction Details 
                  {(dateRangeFrom || dateRangeTo) ? (
                    <span className="text-xs font-normal text-gray-600 ml-2">
                      ({metrics.count} in range, {validRows.length} total)
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-gray-600 ml-2">
                      ({validRows.length} total)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {rows.map((row, index) => {
                    const amount = parseFloat(row.amount);
                    const isValid = !isNaN(amount) && amount > 0 && row.category;
                    const isEditing = editingIndex === index;

                    if (isEditing) {
                      return (
                        <div key={index} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                            <Input
                              type="date"
                              value={row.date}
                              onChange={(e) => updateRow(index, 'date', e.target.value)}
                              className="h-8 text-xs"
                            />
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
                            <Input
                              type="number"
                              step="0.01"
                              value={row.amount}
                              onChange={(e) => updateRow(index, 'amount', e.target.value)}
                              placeholder="0.00"
                              className="h-8 text-xs"
                            />
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
                            <Input
                              type="text"
                              value={row.description}
                              onChange={(e) => updateRow(index, 'description', e.target.value)}
                              placeholder="Description"
                              className="h-8 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => setEditingIndex(null)}
                                className="h-8 flex-1"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeRow(index)}
                                className="h-8"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className={`p-3 border rounded-lg flex items-center justify-between ${
                          isValid
                            ? (() => {
                                // Check if within date range
                                const transactionDate = new Date(row.date);
                                let withinRange = true;
                                
                                if (dateRangeFrom) {
                                  const fromDate = new Date(dateRangeFrom);
                                  if (transactionDate < fromDate) withinRange = false;
                                }
                                if (dateRangeTo) {
                                  const toDate = new Date(dateRangeTo);
                                  toDate.setHours(23, 59, 59, 999);
                                  if (transactionDate > toDate) withinRange = false;
                                }
                                
                                if (!withinRange) {
                                  return 'bg-gray-50 border-gray-200 opacity-40';
                                }
                                
                                return row.type === 'income'
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-red-50 border-red-200';
                              })()
                            : 'bg-gray-50 border-gray-300 opacity-50'
                        }`}
                      >
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
                          <div>
                            <span className="text-xs text-gray-500">Date:</span>
                            <p className="font-medium">{row.date}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Type:</span>
                            <p className={`font-medium ${row.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                              {row.type === 'income' ? '↑ Income' : '↓ Expense'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Amount:</span>
                            <p className={`font-bold ${row.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                              {isValid ? amount.toFixed(2) : row.amount || '-'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Category:</span>
                            <p className="font-medium">{row.category || '-'}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Description:</span>
                            <p className="truncate">{row.description || '-'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingIndex(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeRow(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-between">
          {mode === 'entry' ? (
            <>
              <div className="text-sm text-muted-foreground">
                {validRows.length} of {rows.length} rows ready
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToPreview}
                  disabled={validRows.length === 0}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview {validRows.length} Transactions
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                {validRows.length} transactions • Total: {metrics.net >= 0 ? '+' : ''}{metrics.net.toFixed(2)}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToEntry}>
                  Back to Edit
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={validRows.length === 0 || loading}
                  className="gap-2"
                >
                  {loading ? 'Importing...' : `Import ${validRows.length} Transactions`}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
