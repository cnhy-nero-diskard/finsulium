# FINSULIUM

**Privacy-First Personal Finance Tracking**

FINSULIUM is a personal finance application built on three core principles:

1. **Mindful Entry** - Manual transaction logging forces intentional financial awareness
2. **Data Sovereignty** - You own your data in your own Supabase instance with end-to-end encryption
3. **Powerful Insights** - AI-driven analysis and sophisticated forecasting tools

Unlike traditional finance apps that auto-sync with bank accounts, FINSULIUM requires manual logging to promote intentional awareness. Your data never lives on company servers—it's stored in your personal Supabase database, encrypted with a key only you control.

## ✨ Features

### Transaction Management
- Manual transaction entry with amount, type, date, category, tags, mood, and notes
- Mood-based tracking: Happy (😊), Necessary (👍), Impulse (🤔), Regret (😟)
- Flexible custom tagging system (#work, #lunch, #client-meeting)
- Recurring transaction templates with manual approval (maintains mindfulness)

### Analysis & Insights
- **Financial Timeline** - Highly configurable chart with:
  - Time periods: 7 days, 30 days, 90 days, 1 year, all time
  - Aggregation: Daily, weekly, monthly grouping
  - View modes: Income vs Expenses, Net Flow, Cumulative Net Worth
  - Year-over-year comparison
  - Real-time statistics summary
- **Where It Went** - Pie charts of spending by category
- **Mood Monitor** - Visualize emotional relationship with money
- **Tag Deep Dive** - Spending patterns by custom tags
- **Net Worth / Cash Flow** - Income vs expenses tracking over time
- **Goal Tracker** - Set and monitor financial goals
- **What-If Forecasting** - Scenario planning with goal integration

### Currency Support
- **26+ global currencies** including USD, EUR, GBP, JPY, CAD, AUD, CNY, INR, and more
- One-click currency switching
- Automatic formatting for each currency
- Stored preference persists across sessions

### AI Features
- Pattern recognition and spending trend analysis
- Mindful nudges and positive reinforcement
- Conversational interface for financial questions
- Privacy-first: anonymize data before AI analysis

### Data Management
- CSV import for quick start
- JSON/CSV export (full data ownership)
- Real-time sync across devices

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (user's own instance)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **AI SDK**: Vercel AI SDK
- **State Management**: Zustand
- **Encryption**: Web Crypto API (AES-GCM with PBKDF2 key derivation)

## 🚀 Getting Started

### Prerequisites

1. **Node.js**: Version 18 or higher ⚠️ **IMPORTANT**
   - Check your version: `node --version`
   - If you have an older version, install Node 18+ from [nodejs.org](https://nodejs.org)
   - Or use [nvm](https://github.com/nvm-sh/nvm): `nvm install 18 && nvm use 18`
2. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
3. **(Optional) AI API Key**: OpenAI or Anthropic API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finsulium
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (Optional)**
   
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Note: Supabase credentials can also be entered through the UI during onboarding.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name, database password, and region

2. **Get your credentials**
   - Go to Project Settings > API
   - Copy the "Project URL" (looks like: `https://xxxxx.supabase.co`)
   - Copy the "anon/public" key (looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

3. **Initialize the database**
   - Go to the SQL Editor in your Supabase dashboard
   - Copy the entire contents of `supabase-schema.sql` from this repository
   - Paste it into the SQL Editor
   - Click "Run" to create all tables and insert default data

4. **Complete onboarding**
   - When you first open FINSULIUM, you'll see the onboarding wizard
   - Enter your Supabase Project URL and anon key
   - Click "Test Connection" to verify
   - Choose your encryption method:
     - **Master Password**: Most secure, requires password on each session
     - **Random Key**: Most convenient, save the generated key file securely
   - Click "Complete Setup"

### Encryption Options

**Master Password (Recommended for Security)**
- You create a strong password that derives your encryption key
- Password is never stored or transmitted
- You'll need to enter it each time you access the app
- If you forget it, your encrypted data cannot be recovered

**Random Key (Recommended for Convenience)**
- A cryptographically secure random key is generated
- You download this key and must keep it safe
- Use this key file to access your data on other devices
- If you lose the key file, your encrypted data cannot be recovered

⚠️ **Important**: Your encryption key NEVER leaves your device. Even if someone gains access to your Supabase database, they cannot decrypt your financial data without your key.

## 📁 Project Structure

```
finsulium/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home/onboarding page
│   ├── globals.css             # Global styles
│   └── dashboard/
│       ├── layout.tsx          # Dashboard layout with sidebar
│       ├── page.tsx            # Dashboard home
│       ├── transactions/       # Transaction management
│       ├── analytics/          # Charts and insights
│       ├── goals/              # Goal tracking
│       ├── export/             # Data export
│       └── settings/           # App settings
├── components/
│   ├── onboarding-wizard.tsx   # Setup wizard
│   ├── transaction-modal.tsx   # Add/edit transactions
│   ├── recent-transactions.tsx # Transaction history
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── encryption.ts           # Encryption utilities
│   ├── store.ts                # Zustand state management
│   ├── supabase.ts             # Supabase client
│   ├── utils.ts                # Utility functions
│   └── services/
│       └── transactions.ts     # Transaction API calls
├── supabase-schema.sql         # Database schema
└── package.json
```

## 🔐 Security & Privacy

- **Zero-Knowledge Architecture**: Your encryption key never leaves your browser
- **End-to-End Encryption**: All sensitive data encrypted with AES-GCM (256-bit)
- **Key Derivation**: PBKDF2 with 100,000 iterations for password-based keys
- **Data Sovereignty**: Your data lives in YOUR Supabase instance, not ours
- **No Tracking**: No analytics, no telemetry, no third-party tracking
- **Full Ownership**: Export your data anytime in JSON or CSV format

## 🛠️ Development

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Lint code
```bash
npm run lint
```

## 📊 Database Schema

The application uses the following main tables:

- `categories` - Transaction categories (income/expense)
- `tags` - Flexible tagging system
- `transactions` - Financial transactions (supports encryption)
- `goals` - Financial goals (supports encryption)
- `recurring_templates` - Recurring transaction templates
- `pending_transactions` - Queue for recurring transaction approval
- `user_settings` - Application configuration
- `dashboard_widgets` - Dashboard layout preferences
- `ai_insights` - AI-generated insights history

See `supabase-schema.sql` for complete schema with indexes and triggers.

## 🤝 Contributing

This is a personal finance application designed for self-hosting. Feel free to fork and customize for your needs.

## 📝 License

MIT License - feel free to use this for your own personal finance tracking!

## ⚠️ Disclaimer

This is a personal finance tracking tool. Always maintain your own backups of financial data. The developers are not responsible for any data loss.

## 🆘 Troubleshooting

### Connection Issues
- Verify your Supabase URL and anon key are correct
- Ensure your Supabase project is active and not paused
- Check that you've run the `supabase-schema.sql` script

### Encryption Issues
- If using Master Password: Ensure you're entering the exact same password
- If using Random Key: Verify you're using the correct key file
- Clear browser storage and re-onboard if encryption becomes corrupted

### Data Not Loading
- Open browser console (F12) to check for errors
- Verify Supabase connection in Settings
- Ensure tables were created correctly (check Supabase Table Editor)

## 🗺️ Roadmap

- [x] Phase 1: Onboarding, Supabase connection, encryption setup
- [x] Phase 2: Transaction CRUD, categories, tags
- [ ] Phase 3: Dashboard and basic charts (Where It Went, Mood Monitor)
- [ ] Phase 4: Advanced features (Tag Deep Dive, Net Worth, Goals)
- [ ] Phase 5: AI integration and What-If Forecasting
- [ ] Phase 6: Import/Export functionality

## 💡 Philosophy

FINSULIUM believes in:

- **Mindfulness over automation** - Manual entry creates awareness
- **Privacy by design** - Your data is yours alone
- **Simplicity over complexity** - Powerful features, intuitive interface
- **Ownership over convenience** - Full control of your financial data

---

Built with ❤️ for people who care about financial privacy and mindful spending.
