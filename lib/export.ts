import type { Transaction } from './types';

/**
 * Export transactions as CSV
 */
export function exportTransactionsAsCSV(
  transactions: Transaction[],
  categories: any[],
  currency: string
): string {
  const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Mood', 'Tags', 'Notes'];
  
  const rows = transactions.map(transaction => {
    const category = categories.find(c => c.id === transaction.category_id);
    const categoryName = category?.name || 'Uncategorized';
    
    return [
      transaction.date,
      transaction.type,
      transaction.amount,
      currency,
      categoryName,
      transaction.description || '',
      transaction.mood || '',
      (transaction.tags && transaction.tags.length > 0) ? transaction.tags.join(';') : '',
      transaction.notes || '',
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.map(escapeCSVField).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export all data as JSON
 */
export function exportDataAsJSON(data: {
  transactions: Transaction[];
  categories: any[];
  tags: any[];
  goals: any[];
  currency: string;
  exportDate: string;
}): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Helper function to escape CSV fields
 */
function escapeCSVField(field: any): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);
  
  // If field contains comma, newline, or double quote, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Trigger a file download
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
