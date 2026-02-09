import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseCredentials } from './types';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize Supabase client with user credentials
 */
export function initializeSupabase(credentials: SupabaseCredentials): SupabaseClient {
  supabaseInstance = createClient(credentials.url, credentials.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseInstance;
}

/**
 * Get current Supabase client instance
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized. Please complete onboarding first.');
  }
  return supabaseInstance;
}

/**
 * Test Supabase connection
 */
export async function testConnection(credentials: SupabaseCredentials): Promise<boolean> {
  try {
    const client = createClient(credentials.url, credentials.anonKey);
    const { error } = await client.from('categories').select('count', { count: 'exact', head: true });
    
    // If no error or error is about missing table (expected on first setup), connection is valid
    if (!error || error.message.includes('relation') || error.message.includes('does not exist')) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

/**
 * Clear Supabase instance
 */
export function clearSupabase(): void {
  supabaseInstance = null;
}
