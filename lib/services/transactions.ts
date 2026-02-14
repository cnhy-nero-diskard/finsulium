import { getSupabase } from '../supabase';
import type { Transaction, EncryptedTransaction } from '../types';
import { encryptTransaction, decryptTransaction } from '../encryption';

/**
 * Fetch all transactions
 */
export async function fetchTransactions(
  encryptionKey?: CryptoKey | null
): Promise<Transaction[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .order('date', { ascending: false });

  if (error) throw error;

  // Decrypt if encryption is enabled
  if (encryptionKey && data) {
    const decryptedTransactions = await Promise.all(
      data.map(async (t: any) => {
        if (t.encrypted_data && t.iv) {
          const decrypted = await decryptTransaction(t.encrypted_data, t.iv, encryptionKey);
          return {
            ...t,
            amount: decrypted.amount,
            description: decrypted.description,
            notes: decrypted.notes,
          };
        }
        return t;
      })
    );
    return decryptedTransactions;
  }

  return data || [];
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>,
  encryptionKey?: CryptoKey | null
): Promise<Transaction> {
  const supabase = getSupabase();

  let dataToInsert: any = {
    type: transaction.type,
    date: transaction.date,
    category_id: transaction.category_id,
    mood: transaction.mood,
    tags: transaction.tags,
  };

  // Encrypt sensitive data if encryption is enabled
  if (encryptionKey) {
    const { encrypted_data, iv } = await encryptTransaction(
      {
        amount: transaction.amount,
        description: transaction.description,
        notes: transaction.notes,
      },
      encryptionKey
    );
    dataToInsert.encrypted_data = encrypted_data;
    dataToInsert.iv = iv;
  } else {
    dataToInsert.amount = transaction.amount;
    dataToInsert.description = transaction.description;
    dataToInsert.notes = transaction.notes;
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    amount: transaction.amount,
    description: transaction.description,
    notes: transaction.notes,
  };
}

/**
 * Batch create multiple transactions (for bulk import)
 * Much more efficient than creating one at a time
 */
export async function batchCreateTransactions(
  transactions: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[],
  encryptionKey?: CryptoKey | null
): Promise<Transaction[]> {
  const supabase = getSupabase();

  const dataToInsert = await Promise.all(
    transactions.map(async (transaction) => {
      let recordData: any = {
        type: transaction.type,
        date: transaction.date,
        category_id: transaction.category_id,
        mood: transaction.mood,
        tags: transaction.tags,
      };

      // Encrypt sensitive data if encryption is enabled
      if (encryptionKey) {
        const { encrypted_data, iv } = await encryptTransaction(
          {
            amount: transaction.amount,
            description: transaction.description,
            notes: transaction.notes,
          },
          encryptionKey
        );
        recordData.encrypted_data = encrypted_data;
        recordData.iv = iv;
      } else {
        recordData.amount = transaction.amount;
        recordData.description = transaction.description;
        recordData.notes = transaction.notes;
      }

      return recordData;
    })
  );

  const { data, error } = await supabase
    .from('transactions')
    .insert(dataToInsert)
    .select();

  if (error) throw error;

  // Return with decrypted data
  return (data || []).map((t, idx) => ({
    ...t,
    amount: transactions[idx].amount,
    description: transactions[idx].description,
    notes: transactions[idx].notes,
  }));
}

/**
 * Update a transaction
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>,
  encryptionKey?: CryptoKey | null
): Promise<Transaction> {
  const supabase = getSupabase();

  let dataToUpdate: any = {};

  // Handle non-encrypted fields
  if (updates.type) dataToUpdate.type = updates.type;
  if (updates.date) dataToUpdate.date = updates.date;
  if (updates.category_id) dataToUpdate.category_id = updates.category_id;
  if (updates.mood) dataToUpdate.mood = updates.mood;
  if (updates.tags) dataToUpdate.tags = updates.tags;

  // Handle encrypted fields
  if (encryptionKey && (updates.amount || updates.description || updates.notes)) {
    // Fetch current transaction to merge updates
    const { data: current } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (current) {
      let currentData = { amount: 0, description: '', notes: '' };
      if (current.encrypted_data && current.iv) {
        const decrypted = await decryptTransaction(current.encrypted_data, current.iv, encryptionKey);
        currentData = {
          amount: decrypted.amount ?? 0,
          description: decrypted.description ?? '',
          notes: decrypted.notes ?? '',
        };
      }

      const mergedData = {
        amount: updates.amount ?? currentData.amount,
        description: updates.description ?? currentData.description,
        notes: updates.notes ?? currentData.notes,
      };

      const { encrypted_data, iv } = await encryptTransaction(mergedData, encryptionKey);
      dataToUpdate.encrypted_data = encrypted_data;
      dataToUpdate.iv = iv;
    }
  } else {
    if (updates.amount !== undefined) dataToUpdate.amount = updates.amount;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.notes !== undefined) dataToUpdate.notes = updates.notes;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(dataToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Fetch categories
 */
export async function fetchCategories() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Create a category
 */
export async function createCategory(category: Omit<any, 'id' | 'created_at'>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch tags
 */
export async function fetchTags() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

/**
 * Create a tag
 */
export async function createTag(tag: Omit<any, 'id' | 'created_at'>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tags')
    .insert(tag)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Wipe all data from the database
 */
export async function wipeAllData(): Promise<void> {
  const supabase = getSupabase();

  try {
    // Delete all transactions, goals, and custom categories
    // We don't delete default categories or tags to maintain schema integrity
    await Promise.all([
      supabase.from('transactions').delete().not('id', 'is', null),
      supabase.from('goals').delete().not('id', 'is', null),
    ]);
  } catch (error) {
    console.error('Error during wipe:', error);
    throw error;
  }
}
