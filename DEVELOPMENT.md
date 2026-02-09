# Development Guide

## 🏗️ Architecture Overview

FINSULIUM uses a **client-first architecture** with minimal server-side processing:

```
User Browser (Client)
    ↓
[React + Next.js App Router]
    ↓
[Zustand State Management]
    ↓
[Web Crypto API for Encryption]
    ↓
[Supabase Client SDK]
    ↓
[User's Supabase Instance]
```

### Key Principles

1. **Zero-Knowledge Architecture**: Encryption happens entirely in the browser
2. **Client State Management**: All app state handled by Zustand
3. **Type Safety**: Full TypeScript throughout
4. **Modular Components**: Reusable React components with shadcn/ui

---

## 📦 State Management (Zustand Store)

### Store Structure

The `lib/store.ts` file contains your app's state:

```typescript
useStore.getState()
├── Credentials & Encryption
│   ├── credentials: SupabaseCredentials
│   ├── encryptionConfig: EncryptionConfig
│   ├── encryptionKey: CryptoKey
│   ├── salt: string
│   └── isOnboarded: boolean
├── Data
│   ├── transactions: Transaction[]
│   ├── categories: Category[]
│   ├── tags: Tag[]
│   ├── goals: Goal[]
│   └── settings: UserSettings
└── UI State
    ├── isLoading: boolean
    └── error: string | null
```

### Using the Store in Components

```typescript
import { useStore } from '@/lib/store';

export default function MyComponent() {
  // Read state
  const { transactions, categories } = useStore();

  // Call actions
  const { addTransaction, setLoading } = useStore();
  
  // Mutations are straightforward
  const handleAddTransaction = async () => {
    setLoading(true);
    try {
      const tx = await createTransaction(data, encryptionKey);
      addTransaction(tx);
    } finally {
      setLoading(false);
    }
  };
}
```

### Persisting to LocalStorage

The store automatically persists to localStorage:
```json
{
  "credentials": { "url": "...", "anonKey": "..." },
  "encryptionConfig": { "enabled": true, "type": "password" },
  "isOnboarded": true,
  "salt": "base64-encoded-salt"
}
```

⚠️ **Note**: `encryptionKey` (CryptoKey) is NOT persisted - users must re-enter password/key per session.

---

## 🔐 Adding Encryption to New Data Types

If you want to encrypt new data (like goals), follow this pattern:

### 1. Add Type Definition (lib/types.ts)

```typescript
export interface MyData {
  id: string;
  publicField: string;
  // ... public fields
}

export interface EncryptedMyData extends Omit<MyData, 'sensitiveField'> {
  encrypted_data: string;  // JSON encrypted with AES-GCM
  iv: string;              // Base64-encoded initialization vector
}
```

### 2. Create Encryption Helper (lib/encryption.ts)

```typescript
export async function encryptMyData(
  data: { sensitiveField: string },
  key: CryptoKey
): Promise<{ encrypted_data: string; iv: string }> {
  return await encrypt(data, key);
}

export async function decryptMyData(
  encrypted_data: string,
  iv: string,
  key: CryptoKey
): Promise<{ sensitiveField: string }> {
  return await decrypt(encrypted_data, iv, key);
}
```

### 3. Create Service (lib/services/mydata.ts)

```typescript
export async function createMyData(
  data: MyData,
  encryptionKey?: CryptoKey | null
): Promise<MyData> {
  let toInsert: any = {
    publicField: data.publicField,
  };

  if (encryptionKey) {
    const { encrypted_data, iv } = await encryptMyData(
      { sensitiveField: data.sensitiveField },
      encryptionKey
    );
    toInsert.encrypted_data = encrypted_data;
    toInsert.iv = iv;
  } else {
    toInsert.sensitiveField = data.sensitiveField;
  }

  const { data: created } = await supabase
    .from('my_data')
    .insert(toInsert)
    .select()
    .single();

  return created;
}
```

---

## 📊 Adding New Chart Components

### Using Recharts

FINSULIUM includes Recharts for data visualization. Adding a new chart:

```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function MyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Adding to Dashboard

```typescript
import MyChart from '@/components/my-chart';

export default function DashboardPage() {
  return (
    <>
      <MyChart data={processedData} />
    </>
  );
}
```

---

## 💱 Currency System

### Adding New Currency

Edit `lib/currencies.ts`:

```typescript
export const CURRENCIES = {
  // ... existing
  XYZ: { 
    code: 'XYZ', 
    symbol: '¤', 
    name: 'Your Currency', 
    countries: 'Your Country' 
  },
};
```

### Using Currency in Components

```typescript
import { formatCurrencyWithCode, getCurrencySymbol } from '@/lib/currencies';

export function MoneyDisplay({ amount, currency }) {
  return <div>{formatCurrencyWithCode(amount, currency)}</div>;
}
```

---

## 🗄️ Database Operations

### Adding a New Table

1. **Add to schema** (supabase-schema.sql):
```sql
CREATE TABLE my_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_my_table_updated_at
  BEFORE UPDATE ON my_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

2. **Create service** (lib/services/my-table.ts):
```typescript
import { getSupabase } from '../supabase';

export async function fetchMyTable() {
  const { data, error } = await getSupabase()
    .from('my_table')
    .select('*');
  if (error) throw error;
  return data;
}
```

3. **Add to types** (lib/types.ts):
```typescript
export interface MyTableRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
```

4. **Add to store** (lib/store.ts):
```typescript
interface AppState {
  myTableData: MyTableRow[];
  setMyTableData: (data: MyTableRow[]) => void;
}
```

---

## 🧪 Testing & Debugging

### Browser DevTools

1. **LocalStorage Inspector**:
   - F12 → Application → Local Storage → http://localhost:3000
   - View persisted state

2. **React DevTools**:
   - Install React DevTools browser extension
   - Inspect Zustand store in real-time

3. **Console Logging**:
```typescript
const store = useStore.getState();
console.log(store.transactions);
console.log(store.encryptionKey); // Shows CryptoKey object
```

### Testing Encryption

```typescript
import { generateRandomKey, encrypt, decrypt } from '@/lib/encryption';

async function testEncryption() {
  const key = await generateRandomKey();
  const data = { message: 'Hello' };
  const { encrypted, iv } = await encrypt(data, key);
  const decrypted = await decrypt(encrypted, iv, key);
  console.log('Decrypted:', decrypted); // { message: 'Hello' }
}
```

---

## 🚀 Deploying FINSULIUM

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Important**: 
- No backend environment variables needed
- Supabase credentials are set via onboarding UI
- No sensitive data on server

### Self-Hosted (Docker)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

---

## 📝 Common Tasks

### Add New Category Icon

```typescript
// In transaction-modal.tsx, add to available icons:
const availableIcons = ['🏠', '🚗', '✈️', '🎬', '⚽'];
```

### Add New Mood Option

```typescript
// In lib/types.ts:
export type MoodType = 'happy' | 'necessary' | 'impulse' | 'regret' | 'neutral';

// In supabase-schema.sql:
mood TEXT CHECK (mood IN ('happy', 'necessary', 'impulse', 'regret', 'neutral'))
```

### Change Color Theme

Edit `app/globals.css`:
```css
:root {
  --primary: 222.2 47.4% 11.2%;  /* Dark blue */
  /* ... other colors ... */
}
```

---

## 🐛 Troubleshooting

### Encryption Key Lost

**Password mode**: User must know password (cannot recover)
**Random key mode**: Check browser LocalStorage for saved key

### Data Not Loading from Supabase

```typescript
// Check Supabase connection
const { error } = await supabase
  .from('transactions')
  .select('*')
  .limit(1);

console.log('Supabase error:', error);
```

### Chart Not Rendering

```typescript
// Ensure data is not empty and has correct format
console.log('Chart data:', data);
// Should be: Array<{ name: string, value: number }>
```

---

## 📚 Additional Resources

- **Recharts Docs**: https://recharts.org
- **Zustand Docs**: https://zustand-demo.vercel.app
- **Supabase Docs**: https://supabase.com/docs
- **Web Crypto API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

---

Happy developing! 🚀
