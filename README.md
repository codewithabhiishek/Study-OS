# StudyOS ⚡

> **A fast, cyberpunk-styled productivity operating system for students, developers, and autonomous learners.**
> 100% Free & Open-Source under the MIT License.

Repository: [https://github.com/codewithabhiishek/Study-OS](https://github.com/codewithabhiishek/Study-OS)

---

## 🚀 Overview

StudyOS replaces fragmented productivity tools, bloated Notion setups, and overpriced timer apps with a distraction-free cockpit:

- **🏠 Landing Page**: Clean, high-impact cyberpunk entry point with quick authentication, feature breakdown, and open-source guarantees.
- **🎯 Today Horizon**: Top-3 daily priorities, streak trackers, anime companions (Luffy), and active mission banners.
- **⏱️ Cyber Focus Engine**: Pomodoro & deep-work timer with ambient soundscapes, electric pulses, and automatic database session logging.
- **📁 Project Matrix**: Track coursework, research papers, and software projects with subtask progress bars.
- **🔥 Atomic Habits**: Daily habit streaks with one-tap check-ins and multiplier fire badges.
- **📅 Timeline & Deadlines**: Countdown clocks for exams, assignments, and university applications.
- **📊 Weekly Intelligence**: Focus hour heatmaps, habit compliance analytics, and reflection journaling.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS 3, Lucide Icons, shadcn/ui (Radix)
- **Routing & State**: React Router 6, TanStack Query 5
- **Backend & Auth**: Supabase JS v2 (PostgreSQL + Row-Level Security)
- **Deployment**: Vercel / Netlify / Docker ready (PWA support)

---

## 📦 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/codewithabhiishek/Study-OS.git
cd Study-OS
npm install
```

### 2. Configure Environment

Create a `.env` file at the root:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Initialize Supabase Database

Run the SQL migration in your Supabase **SQL Editor**:
```sql
supabase/migrations/0001_init.sql
```

Tables created with per-user Row Level Security (RLS):
- `projects`
- `tasks`
- `habits`
- `deadlines`
- `focus_sessions`
- `universities`

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## 🚢 Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License

MIT License. 100% Free & Open-Source. Built by [Abhishek](https://github.com/codewithabhiishek).
