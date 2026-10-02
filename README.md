# Shanmukha Agritech: Field Agent Tracking Web App (PWA)

A complete, production-ready, mobile-first Progressive Web Application built for field agents and administrators at **Shanmukha Agritech**. Field agents visit farmers, record crop condition diagnoses and product prescriptions, update purchase status upon sale, and queue visits offline when network coverage is weak. Admins monitor operations, manage agents via Supabase Edge Functions, analyze location hierarchies, and export reports in English.

---

## 🌟 Features

- **Mobile-First Design**: Optimized for 360px-wide Android devices with touch targets $\ge 48\text{px}$, responsive layout, and Google Fonts (`Noto Sans` & `Noto Sans Telugu`).
- **Bilingual Interface**: Seamless UI language toggle (English & Telugu) with instant switching.
- **Forced English Reports**: All exported Excel (`.xlsx`), CSV files, and print/PDF reports are rendered in English regardless of the UI language.
- **Offline PWA & IndexedDB Sync**: Automatically caches the PWA shell and queues visit records (including compressed photos) in IndexedDB when offline, automatically syncing when connectivity resumes.
- **Supabase Architecture**: 
  - Postgres database with RLS policies, indexes, and custom triggers (`visit_audit`, `updated_at`).
  - RPC function `get_or_create_location` for location hierarchy normalization and case-insensitive deduplication.
  - RPC functions `admin_rename_location` and `admin_merge_location` for location tree management.
  - Private Supabase Storage bucket `purchase-photos` accessed securely via signed URLs.
  - Supabase Edge Function `admin-manage-agents` for admin agent creation, password resets, and activation control using the server-side service role key.

---

## 📋 Technology Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Database & Auth**: `@supabase/supabase-js` (Supabase Auth, Postgres, Storage, Edge Functions)
- **Internationalization**: `react-i18next` & `i18next`
- **Routing**: `react-router-dom`
- **PWA & Offline**: `vite-plugin-pwa`, `idb` (IndexedDB)
- **Exports & Compression**: `xlsx` (SheetJS), `browser-image-compression`
- **Icons**: `lucide-react`
- **Testing**: `vitest`

---

## 🚀 Setup & Deployment Guide

Follow these exact steps to set up and deploy the project from scratch:

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-org/fieldagent.git
cd fieldagent
npm install
```

---

### Step 2: Supabase Project Setup & Database Migration

1. Create a project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard.
3. Paste and run the entire content of [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql). This creates all tables (`profiles`, `regions`, `districts`, `villages`, `crops`, `products`, `visits`, `visit_audit`), indexes, triggers, RPC functions, RLS policies, and the private `purchase-photos` storage bucket.
4. Next, run [`supabase/seed.sql`](supabase/seed.sql) to seed default crops, products, and sample location data.

---

### Step 3: Disable Email Confirmation in Supabase Auth

1. Go to **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email** in the Supabase Dashboard.
2. Toggle OFF **"Confirm email"** (Ensure `email_confirm: true` behavior so agents created by admin can sign in immediately without email confirmation).

---

### Step 4: Deploy Supabase Edge Function (`admin-manage-agents`)

1. Install the Supabase CLI if not already installed:
   ```bash
   npm install -g supabase
   ```
2. Login to your Supabase CLI:
   ```bash
   supabase login
   ```
3. Link your local directory to your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
4. Set the Edge Function secrets:
   ```bash
   supabase secrets set SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Deploy the Edge Function:
   ```bash
   supabase functions deploy admin-manage-agents
   ```

---

### Step 5: Bootstrap the First Admin User

1. In the Supabase Dashboard, go to **Authentication** $\rightarrow$ **Users** $\rightarrow$ **Add User** $\rightarrow$ **Create User**.
2. Enter an email (e.g., `admin@shanmukhaagritech.com`) and password.
3. Once created, copy the user's `UUID`.
4. Open the SQL Editor and execute:
   ```sql
   insert into public.profiles (id, role, full_name, username, is_active, preferred_language)
   values ('<PASTE-USER-UUID-HERE>', 'admin', 'System Admin', 'admin@shanmukhaagritech.com', true, 'en');
   ```

---

### Step 6: Set Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

### Step 7: Run Locally

```bash
# Start development server
npm run dev

# Run unit tests
npx vitest run

# Build for production
npm run build
```

---

### Step 8: Deploy to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Import the repository into [Vercel](https://vercel.com).
3. Set the Environment Variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
4. Click **Deploy**. Vercel will automatically detect `vercel.json` for SPA rewrites.

---

## 📖 Admin User Guide

### How to Add New Field Agents
1. Log in as Admin and navigate to the **Agents** tab.
2. Click **Add New Field Agent**.
3. Enter Full Name, simple Username (e.g. `ramesh01`), Phone, and a Temporary Password.
4. The system securely invokes the Edge Function to create the auth user (`ramesh01@agents.shanmukhaagritech.app`) and profile row.
5. The agent can immediately log in using `ramesh01` and the password!

### How to Export & Print Reports
1. Log in as Admin and go to **Export & Print** (or use filters on the Visits screen).
2. Choose your filter scope (Agent, Date Range, Status, Region/District/Village).
3. Click **Download Excel (.xlsx)** or **Download CSV** to generate instant English files.
4. Click **Summary Print** (A4 landscape table) or **Detailed Print** (1 visit per block with purchase photo thumbnail) to generate printable PDFs.

---

## 🧪 Unit Tests

Run unit tests covering location normalization, forced English export utilities, and status rules:
```bash
npx vitest run
```
