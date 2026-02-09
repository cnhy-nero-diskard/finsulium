// Core TypeScript interfaces for FINSULIUM

export type TransactionType = 'income' | 'expense';

export type MoodType = 'happy' | 'necessary' | 'impulse' | 'regret';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: string;
  category_id: string;
  category?: Category;
  description?: string;
  mood?: MoodType;
  tags: string[]; // Array of tag IDs
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export interface EncryptedTransaction extends Omit<Transaction, 'amount' | 'description' | 'notes'> {
  encrypted_data: string; // Encrypted JSON containing amount, description, notes
  iv: string; // Initialization vector for decryption
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category_id?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EncryptedGoal extends Omit<Goal, 'target_amount' | 'current_amount' | 'description'> {
  encrypted_data: string;
  iv: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  description?: string;
  mood?: MoodType;
  tags: string[];
  enabled: boolean;
  next_generation_date: string;
  created_at: string;
}

export interface PendingTransaction {
  id: string;
  template_id: string;
  scheduled_date: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  description?: string;
  mood?: MoodType;
  tags: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  date_format: string;
  theme: 'light' | 'dark' | 'system';
  encryption_enabled: boolean;
  encryption_type?: 'password' | 'random_key';
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  user_id: string;
  widget_type: string;
  position: number;
  size: 'small' | 'medium' | 'large';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AIInsight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  encrypted_data?: string;
  iv?: string;
  created_at: string;
  dismissed: boolean;
}

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

export interface EncryptionConfig {
  enabled: boolean;
  type: 'password' | 'random_key';
  key?: CryptoKey; // Stored in memory only
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MoodDistribution {
  mood: MoodType;
  count: number;
  total_amount: number;
  emoji: string;
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expenses: number;
  net: number;
}

export interface TagSpending {
  tag: string;
  amount: number;
  transactions: number;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface ForecastScenario {
  id: string;
  name: string;
  description?: string;
  monthly_income_change: number;
  monthly_expense_change: number;
  one_time_expenses: Array<{
    date: string;
    amount: number;
    description: string;
  }>;
  duration_months: number;
  created_at: string;
}
