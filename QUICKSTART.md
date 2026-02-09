# FINSULIUM Quick Start Guide

## 🚀 Complete Setup in 15 Minutes

This guide will walk you through setting up FINSULIUM from scratch.

### Step 1: Check Node.js Version (2 minutes)

```bash
node --version
```

**You MUST have Node.js 18 or higher.** If you see a version lower than 18:

#### Option A: Install Latest Node.js
1. Go to [nodejs.org](https://nodejs.org)
2. Download and install the LTS version
3. Restart your terminal
4. Verify: `node --version`

#### Option B: Use NVM (Node Version Manager)
```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 18
nvm install 18
nvm use 18
```

### Step 2: Install Dependencies (3 minutes)

```bash
cd finsulium
npm install
```

This will install all required packages. It may take a few minutes.

### Step 3: Set Up Supabase (5 minutes)

1. **Create a Supabase account**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project"
   - Sign up with GitHub or email

2. **Create a new project**
   - Click "+ New Project"
   - Choose a name (e.g., "finsulium")
   - Set a database password (save it!)
   - Choose a region near you
   - Click "Create new project"
   - Wait 1-2 minutes for provisioning

3. **Get your credentials**
   - When ready, go to Settings > API
   - Copy "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - Copy "anon/public" key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

4. **Initialize the database**
   - Go to SQL Editor
   - Click "+ New Query"
   - Open `supabase-schema.sql` from this project
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" (bottom right)
   - You should see "Success. No rows returned"

### Step 4: Start the Application (1 minute)

```bash
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 5: Complete Onboarding (4 minutes)

1. **Open your browser**
   - Go to [http://localhost:3000](http://localhost:3000)

2. **Enter Supabase credentials**
   - Paste your Project URL
   - Paste your anon/public key
   - Click "Test Connection"
   - ✅ Should say "Connection successful!"
   - Click "Continue"

3. **Choose encryption method**

   **Master Password (Recommended for Security):**
   - Choose "Master Password" tab
   - Enter a strong password (min 8 characters)
   - Confirm the password
   - ⚠️ **REMEMBER THIS PASSWORD** - it cannot be recovered!
   
   **Random Key (Recommended for Convenience):**
   - Choose "Random Key" tab
   - Click "Generate Encryption Key"
   - Click "Download Key"
   - Save the file somewhere safe (you'll need it on other devices)

4. **Complete setup**
   - Click "Complete Setup"
   - You're in! 🎉

### Step 6: Add Your First Transaction

1. Click the "+ Add Transaction" button
2. Fill in the details:
   - Choose Income or Expense
   - Enter amount (e.g., 50.00)
   - Select a date
   - Pick a category
   - Add a description
   - (Optional) Set mood and tags
3. Click "Add Transaction"

Congratulations! You're now tracking your finances with complete privacy. 🔒

---

## 📱 Access from Another Device

### If using Master Password:
- Just open the app and enter the same password

### If using Random Key:
1. Have your encryption key file ready
2. Go through onboarding again with the same Supabase credentials
3. When asked for encryption, choose "Random Key"
4. Paste the key from your saved file

---

## 🆘 Troubleshooting

### "Connection failed"
- Double-check your Supabase URL and key
- Make sure your Supabase project is active (not paused)
- Try copying the credentials again

### "Failed to load data"
- Verify you ran the `supabase-schema.sql` script
- Check the SQL Editor in Supabase for any errors
- Make sure tables were created (check Table Editor)

### Port 3000 already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Dependencies won't install
- Make sure you're using Node 18+
- Try: `rm -rf node_modules package-lock.json && npm install`

---

## 🎯 Next Steps

- **Explore the Dashboard**: Check out your stats and recent transactions
- **Create Custom Tags**: Add tags like #groceries, #entertainment, #workexpense
- **Track Your Mood**: Use mood tracking to understand emotional spending patterns
- **Export Your Data**: Remember, you own it! Export anytime from Settings

---

## 💡 Pro Tips

1. **Daily Logging**: Log transactions at the end of each day for mindfulness
2. **Use Moods**: Track how you feel about expenses to gain insights
3. **Tag Everything**: Tags help you analyze spending across categories
4. **Regular Backups**: Export your data monthly
5. **Secure Your Key**: If using random key, keep multiple copies safe

---

**Need help?** Check the main [README.md](README.md) for detailed documentation.

Enjoy FINSULIUM! 🚀
