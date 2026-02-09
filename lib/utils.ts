import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for invalid currency codes
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format date
 */
export function formatDate(date: string | Date, format: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Get mood emoji
 */
export function getMoodEmoji(mood: string): string {
  const moodMap: Record<string, string> = {
    happy: '😊',
    necessary: '👍',
    impulse: '🤔',
    regret: '😟',
  };
  return moodMap[mood] || '💰';
}

/**
 * Get mood label
 */
export function getMoodLabel(mood: string): string {
  const labelMap: Record<string, string> = {
    happy: 'Happy',
    necessary: 'Necessary',
    impulse: 'Impulse',
    regret: 'Regret',
  };
  return labelMap[mood] || mood;
}

/**
 * Generate random color for categories/tags
 */
export function generateRandomColor(): string {
  const colors = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Group transactions by date
 */
export function groupByDate<T extends { date: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = item.date.split('T')[0]; // Get YYYY-MM-DD
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Group transactions by month
 */
export function groupByMonth<T extends { date: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const date = new Date(item.date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Download data as JSON
 */
export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as CSV
 */
export function downloadCSV(data: any[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || '')).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map((h) => h.trim());
        
        const data = lines.slice(1).map((line) => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index]?.trim() || '';
          });
          return obj;
        });
        
        resolve(data.filter((row) => Object.values(row).some((v) => v)));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
