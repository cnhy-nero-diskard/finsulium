# Currency Change Implementation

## Overview

When a user changes their currency in Settings, FINSULIUM now intelligently asks how to handle existing transactions:

1. **No Transactions**: Currency changes immediately
2. **Existing Transactions**: Shows a dialog with two options:
   - **Keep As Is**: Keeps all existing transactions in their original currency
   - **Convert**: Converts all transactions to the new currency using a specified exchange rate

## User Experience Flow

```
User changes currency
    ↓
Any existing transactions?
    ├─ NO → Currency updated immediately ✓
    └─ YES → Show CurrencyChangeDialog
              ├─ Option 1: Keep As Is
              │   └─ Click "Keep As Is" 
              │       → Currency updated
              │       → Old transactions unchanged
              └─ Option 2: Convert All
                  → Enter conversion rate
                  └─ Click "Convert"
                      → All amounts multiplied by rate
                      → Transactions updated in DB
                      → Currency updated
```

## Implementation Details

### Components

**`components/currency-change-dialog.tsx`** (NEW)
- Beautiful modal dialog with two distinct options
- Real-time conversion rate input validation
- Clear summary showing old → new currency
- Transaction count display
- Info boxes explaining implications

**Features:**
- Radio button selection for each option
- Conversion rate input (step 0.001 for precision)
- Examples: "1 USD = 0.92 EUR"
- Error handling with user-friendly messages
- Loading states during conversion

### Store Updates (`lib/store.ts`)

- Added `currency: string` field to store state
- Added `setCurrency()` action
- Updated localStorage persistence to save currency
- Currency persists across browser sessions

### Service Layer (`lib/services/currency.ts`)

**Functions:**

1. **`convertTransactionsCurrency(transactions, conversionRate)`**
   - Pure function: multiplies all amounts by conversion rate
   - Rounds to 2 decimal places
   - Does NOT modify database

2. **`updateTransactionsCurrencyInDB(oldCurrency, newCurrency, conversionRate)`**
   - Converts all transactions locally
   - Updates each transaction in Supabase
   - Updates user_settings table with new currency
   - Updates Zustand store with converted data

3. **`updateCurrencyWithoutConversion(oldCurrency, newCurrency)`**
   - Only updates user_settings currency
   - Leaves all transactions unchanged
   - Fast operation

### Settings Page Updates (`app/dashboard/settings/page.tsx`)

- Removed local currency state
- Uses `currency` from Zustand store
- Displays transaction count in description
- Calls dialog on currency change
- Handles both conversion paths

### Dashboard Updates (`app/dashboard/page.tsx`)

- Uses `currency` from store instead of local state
- Currency automatically syncs across app
- Charts and formatting use current currency

## Data Flow

### Scenario 1: Keep As Is

```
User selects new currency
    ↓
updateCurrencyWithoutConversion(oldCurrency, newCurrency)
    ├─ Update Supabase: user_settings.default_currency
    └─ Update Zustand: setCurrency(newCurrency)
    ↓
All transactions remain unchanged
Charts/formatting use new currency for display only
```

### Scenario 2: Convert Transactions

```
User selects conversion option + enters rate
    ↓
updateTransactionsCurrencyInDB(oldCurrency, newCurrency, rate)
    ├─ Convert amounts: amount * rate
    ├─ Batch update Supabase transactions
    ├─ Update Supabase: user_settings.default_currency
    └─ Update Zustand store
    ↓
All transactions updated with new amounts
New currency reflected everywhere
```

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User has 0 transactions | Currency changes immediately (no dialog) |
| User enters invalid rate (0, negative, NaN) | Error message, conversion blocked |
| Supabase update fails | Error displayed, currency not changed |
| User cancels dialog | Settings unchanged |
| User switches back and forth | Each change prompts dialog |

## Database Impact

### Transactions Table
- `amount` field updated with converted values
- `updated_at` timestamp updated
- `encrypted_data` NOT changed (encryption is separate from currency) *

### User Settings Table
- `default_currency` updated
- `updated_at` timestamp updated

*Note: If amounts are encrypted, they remain encrypted. Decryption happens in browser memory only.

## Future Enhancements

1. **Exchange Rate API Integration**
   - Auto-fetch current rates from API
   - Display "typical" rates when user changes currency
   - Optional: store exchange rate history

2. **Bulk Currency Tags**
   - Add "original_currency" metadata to transactions
   - Show "Originally $100 USD, now €92 EUR"
   - Mixed currency reports

3. **Undo/Rollback**
   - Store previous currency conversions
   - One-click undo last conversation
   - Conversion history audit log

4. **Multi-Currency Support**
   - Allow transactions in different currencies
   - Convert to base currency for analytics
   - Per-transaction currency field

## Testing Checklist

- [ ] Change currency with 0 transactions (immediate change)
- [ ] Change currency with 5+ transactions (shows dialog)
- [ ] Select "Keep As Is" (old transactions unchanged, new currency applied)
- [ ] Select "Convert" with valid rate (all amounts updated)
- [ ] Enter invalid rate (error shown, changes blocked)
- [ ] Cancel dialog (settings unchanged)
- [ ] Refresh page (currency persisted from localStorage)
- [ ] Check Supabase (transactions and user_settings updated)
- [ ] Charts reflect new currency (formatting, symbols)
- [ ] Modal accessibility (keyboard navigation, screen readers)
