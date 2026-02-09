import { Transaction } from '@/lib/types';
import { getSupabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

/**
 * Convert all transactions from one currency to another
 * @param transactions - Array of transactions to convert
 * @param conversionRate - Conversion multiplier (e.g., 0.92 for 1 USD = 0.92 EUR)
 * @returns Converted transactions
 */
export function convertTransactionsCurrency(
  transactions: Transaction[],
  conversionRate: number
): Transaction[] {
  return transactions.map((transaction) => ({
    ...transaction,
    amount: Number((transaction.amount * conversionRate).toFixed(2)),
  }));
}

/**
 * Update all transactions in database with converted amounts
 * @param oldCurrency - Current currency code
 * @param newCurrency - New currency code
 * @param conversionRate - Conversion multiplier
 */
export async function updateTransactionsCurrencyInDB(
  oldCurrency: string,
  newCurrency: string,
  conversionRate: number
): Promise<void> {
  const store = useStore.getState();
  const supabase = getSupabase();

  const transactions = store.transactions;

  if (transactions.length === 0) {
    return; // Nothing to convert
  }

  // Convert transactions locally
  const convertedTransactions = convertTransactionsCurrency(
    transactions,
    conversionRate
  );

  // Update all transactions in database
  // Update each transaction individually to preserve all required fields
  const updatePromises = convertedTransactions.map((transaction) =>
    supabase
      .from('transactions')
      .update({
        amount: transaction.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
  );

  const results = await Promise.all(updatePromises);
  
  // Check for any errors
  const error = results.find(result => result.error)?.error;
  if (error) {
    throw new Error(`Failed to update transactions: ${error.message}`);
  }

  // Update user settings to track currency change
  const { error: settingsError } = await supabase
    .from('user_settings')
    .update({
      default_currency: newCurrency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', store.settings?.id);

  if (settingsError) {
    console.warn(
      'Failed to update user_settings currency:',
      settingsError.message
    );
  }

  // Update store with converted transactions
  store.setTransactions(convertedTransactions);
  store.setCurrency(newCurrency);
}

/**
 * Handle keeping transactions as-is without conversion
 * Just update the user's default currency setting
 */
export async function updateCurrencyWithoutConversion(
  oldCurrency: string,
  newCurrency: string
): Promise<void> {
  const store = useStore.getState();
  const supabase = getSupabase();

  // Update user settings to track currency change
  const { error } = await supabase
    .from('user_settings')
    .update({
      default_currency: newCurrency,
      updated_at: new Date().toISOString(),
    })
    .eq('id', store.settings?.id);

  if (error) {
    throw new Error(`Failed to update user settings: ${error.message}`);
  }

  // Update store with new currency
  store.setCurrency(newCurrency);
}
