import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  SupabaseCredentials,
  EncryptionConfig,
  Transaction,
  Category,
  Tag,
  Goal,
  UserSettings,
} from './types';

interface AppState {
  // Credentials & Encryption
  credentials: SupabaseCredentials | null;
  encryptionConfig: EncryptionConfig | null;
  isOnboarded: boolean;
  encryptionKey: CryptoKey | null;
  salt: string | null; // For password-based encryption

  // Data
  transactions: Transaction[];
  categories: Category[];
  tags: Tag[];
  goals: Goal[];
  settings: UserSettings | null;
  currency: string; // Current currency code (e.g., 'USD', 'EUR')

  // UI State
  isLoading: boolean;
  error: string | null;

  // Actions - Credentials
  setCredentials: (credentials: SupabaseCredentials) => void;
  setEncryptionConfig: (config: EncryptionConfig) => void;
  setEncryptionKey: (key: CryptoKey | null) => void;
  setSalt: (salt: string | null) => void;
  setOnboarded: (value: boolean) => void;
  clearCredentials: () => void;

  // Actions - Data
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;

  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;

  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  setCurrency: (currency: string) => void;
  setSettings: (settings: UserSettings) => void;

  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      credentials: null,
      encryptionConfig: null,
      isOnboarded: false,
      encryptionKey: null,
      salt: null,

      transactions: [],
      categories: [],
      tags: [],
      goals: [],
      currency: 'USD',
      settings: null,

      isLoading: false,
      error: null,

      // Credential actions
      setCredentials: (credentials) => set({ credentials }),
      setEncryptionConfig: (config) => set({ encryptionConfig: config }),
      setEncryptionKey: (key) => set({ encryptionKey: key }),
      setSalt: (salt) => set({ salt }),
      setOnboarded: (value) => set({ isOnboarded: value }),
      clearCredentials: () =>
        set({
          credentials: null,
          encryptionConfig: null,
          isOnboarded: false,
          encryptionKey: null,
          salt: null,
          transactions: [],
          categories: [],
          tags: [],
          goals: [],
          settings: null,
        }),

      // Data actions
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [transaction, ...state.transactions] })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({ categories: [...state.categories, category] })),

      setTags: (tags) => set({ tags }),
      addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),

      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      updateGoal: (id, updates) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),

      setCurrency: (currency) => set({ currency }),
      setSettings: (settings) => set({ settings }),

      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'finsulium-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        credentials: state.credentials,
        encryptionConfig: state.encryptionConfig,
        currency: state.currency,
        isOnboarded: state.isOnboarded,
        salt: state.salt,
        // Note: encryptionKey is NOT persisted for security
      }),
    }
  )
);
