# StudyOS

A personal study operating system: today view, projects, habits, focus
timer, deadlines, university tracker, and weekly review.

This codebase has been fully migrated to **Supabase**
(auth + Postgres + RLS). The UI is unchanged.

## Tech stack

- React 18 + Vite 6
- TanStack Query 5
- React Router 6
- Tailwind CSS 3 + shadcn/ui (Radix)
- Supabase JS v2 (auth + database)

## 1. Install

```bash
npm install
```

## 2. Configure Supabase

1. Create a project at <https://supabase.com>.
2. In **Project Settings → API**, copy:
   - `Project URL`
   - `anon public` key
3. Create `.env` at the project root:

```bash
cp .env.example .env
```

…and fill in:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 3. Create the database schema

Open the Supabase **SQL Editor** and run the migration:

```
supabase/migrations/0001_init.sql
```

It creates these tables with per-user Row Level Security:

- `projects`
- `tasks`
- `habits`
- `deadlines`
- `focus_sessions`
- `universities`

Authentication uses Supabase's built-in `auth.users`. No `profiles` table
is needed because no extra user metadata is stored.

### Optional: Google sign-in

Enable **Authentication → Providers → Google** in the Supabase dashboard
and add an OAuth client. The Login / Register pages already have a
"Continue with Google" button wired up.

## 4. Run locally

```bash
npm run dev
```

Open <http://localhost:5173>. Create an account on `/register`, then
log in.

## 5. Build for production

```bash
npm run build
npm run preview
```

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages,
GitHub Pages, S3+CloudFront…). Set the same two environment variables
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) at build time.

### Vercel example

```bash
vercel --prod
# then in the dashboard, add:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
```

### Netlify example

```bash
netlify deploy --prod --build
# add the same two env vars in the Netlify UI
```

## Project layout

```
src/
  api/supabaseClient.js     ← thin Supabase-backed compatibility shim
  lib/
    supabase.js           ← Supabase client
    AuthContext.jsx       ← Supabase Auth context
    query-client.js
    PageNotFound.jsx
    utils.js
  components/             ← UI + feature components
  pages/                  ← route pages
supabase/
  migrations/0001_init.sql
```


