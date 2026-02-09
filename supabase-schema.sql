-- FINSULIUM Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table (supports both encrypted and non-encrypted data)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  mood TEXT CHECK (mood IN ('happy', 'necessary', 'impulse', 'regret')),
  tags TEXT[] DEFAULT '{}',
  
  -- Non-encrypted fields (when encryption is disabled)
  amount DECIMAL(12, 2),
  description TEXT,
  notes TEXT,
  
  -- Encrypted fields (when encryption is enabled)
  encrypted_data TEXT,
  iv TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  target_date DATE,
  
  -- Non-encrypted fields
  target_amount DECIMAL(12, 2),
  current_amount DECIMAL(12, 2) DEFAULT 0,
  description TEXT,
  
  -- Encrypted fields
  encrypted_data TEXT,
  iv TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring transaction templates
CREATE TABLE IF NOT EXISTS recurring_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  description TEXT,
  mood TEXT CHECK (mood IN ('happy', 'necessary', 'impulse', 'regret')),
  tags TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  next_generation_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending transactions (from recurring templates)
CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES recurring_templates(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  mood TEXT CHECK (mood IN ('happy', 'necessary', 'impulse', 'regret')),
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency TEXT NOT NULL DEFAULT 'USD',
  date_format TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  encryption_enabled BOOLEAN DEFAULT FALSE,
  encryption_type TEXT CHECK (encryption_type IN ('password', 'random_key')),
  ai_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard widgets configuration
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  size TEXT NOT NULL DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI insights history
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  encrypted_data TEXT,
  iv TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_goals_target_date ON goals(target_date);
CREATE INDEX idx_pending_transactions_status ON pending_transactions(status);
CREATE INDEX idx_pending_transactions_date ON pending_transactions(scheduled_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO categories (name, icon, color, type) VALUES
  ('Salary', '💼', '#10b981', 'income'),
  ('Freelance', '💻', '#3b82f6', 'income'),
  ('Investment', '📈', '#8b5cf6', 'income'),
  ('Other Income', '💰', '#06b6d4', 'income'),
  ('Food & Dining', '🍽️', '#ef4444', 'expense'),
  ('Transportation', '🚗', '#f59e0b', 'expense'),
  ('Shopping', '🛍️', '#ec4899', 'expense'),
  ('Entertainment', '🎬', '#a855f7', 'expense'),
  ('Bills & Utilities', '📱', '#6366f1', 'expense'),
  ('Healthcare', '⚕️', '#14b8a6', 'expense'),
  ('Education', '📚', '#3b82f6', 'expense'),
  ('Travel', '✈️', '#f59e0b', 'expense'),
  ('Housing', '🏠', '#84cc16', 'expense'),
  ('Other Expense', '💸', '#64748b', 'expense')
ON CONFLICT DO NOTHING;

-- Insert default user settings
INSERT INTO user_settings (currency, date_format, theme, encryption_enabled, ai_enabled)
VALUES ('USD', 'MM/DD/YYYY', 'system', false, false)
ON CONFLICT DO NOTHING;

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (widget_type, position, size, enabled) VALUES
  ('spending_by_category', 1, 'large', true),
  ('mood_monitor', 2, 'medium', true),
  ('net_worth', 3, 'medium', true),
  ('recent_transactions', 4, 'large', true)
ON CONFLICT DO NOTHING;
