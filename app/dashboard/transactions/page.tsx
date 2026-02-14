'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';
import TransactionModal from '@/components/transaction-modal';
import BulkTransactionImport from '@/components/bulk-transaction-import';
import DeleteTransactionDialog from '@/components/delete-transaction-dialog';
import { formatCurrency, formatDate, getMoodEmoji } from '@/lib/utils';
import { Plus, Edit2, Trash2, Filter, Upload } from 'lucide-react';
import { fetchCategories, fetchTags, deleteTransaction } from '@/lib/services/transactions';
import type { Transaction } from '@/lib/types';

export default function TransactionsPage() {
  const { transactions, categories, currency, setCategories, setTags, setLoading, deleteTransaction: removeTransaction } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Load categories and tags on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [categoriesData, tagsData] = await Promise.all([
          fetchCategories(),
          fetchTags(),
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (error) {
        console.error('Failed to load categories and tags:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setCategories, setTags, setLoading]);

  const handleAddNew = () => {
    setSelectedTransaction(null);
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (transaction: any) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      setLoading(true);
      await deleteTransaction(transactionToDelete.id);
      removeTransaction(transactionToDelete.id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your transactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkImportOpen(true)} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'income' ? 'default' : 'outline'}
            onClick={() => setFilter('income')}
            size="sm"
          >
            Income
          </Button>
          <Button
            variant={filter === 'expense' ? 'default' : 'outline'}
            onClick={() => setFilter('expense')}
            size="sm"
          >
            Expenses
          </Button>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>
              All Transactions ({filteredTransactions.length})
            </CardTitle>
            <CardDescription>
              {filter === 'all'
                ? 'Showing all transactions'
                : `Showing ${filter} transactions`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  No transactions found
                </p>
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => {
                  const category = categories.find(
                    (c) => c.id === transaction.category_id
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {category?.icon || '💰'}
                          </span>
                          <div>
                            <p className="font-medium">
                              {transaction.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{formatDate(transaction.date)}</span>
                              <span>•</span>
                              <span>{category?.name || 'Uncategorized'}</span>
                              {transaction.mood && (
                                <>
                                  <span>•</span>
                                  <span>{getMoodEmoji(transaction.mood)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`text-lg font-semibold ${
                            transaction.type === 'income'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, currency)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
      />
      
      <BulkTransactionImport
        open={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <DeleteTransactionDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTransactionToDelete(null);
        }}
        transaction={transactionToDelete}
        currency={currency}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
