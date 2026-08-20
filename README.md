<div align="center">

# ⚡ STUDY OS

### *The Cyberpunk Productivity Cockpit for Students & Developers*

[![MIT License](https://img.shields.io/badge/License-MIT-00FF87.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=black)](https://opensource.org/licenses/MIT)
[![React 18](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite 6](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase_RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-FF006E.svg?style=for-the-badge)](https://github.com/codewithabhiishek/Study-OS/pulls)

<p align="center">
  <b>100% Free & Open-Source</b> • <b>Zero Ads</b> • <b>Zero Subscriptions</b> • <b>Full Data Ownership</b>
</p>

[**🌐 Live Demo**](https://mystudy-os.vercel.app) • [**⚡ Getting Started**](#-quick-start) • [**🎯 Core Modules**](#-core-modules) • [**🗄️ Database Setup**](#-supabase-database-setup)

---

</div>

## 🌌 Overview

**StudyOS** is a distraction-free, high-performance study operating system designed to replace clunky Notion templates, overpriced timer apps, and fragmented to-do lists. 

Built with pitch-black cyberpunk aesthetics (`#000000`), Electric Neon Green (`#00FF87`), and Hot Neon Magenta (`#FF006E`), it delivers instant visual feedback to keep you in a state of hyper-focus.

---

## 🎯 Core Modules

<table>
  <tr>
    <td width="50%">
      <h3>🎯 01. Today Horizon</h3>
      <p>Lock in on your daily Top-3 missions, habits, and live countdowns. Powered by Luffy's daily discipline quotes.</p>
    </td>
    <td width="50%">
      <h3>⏱️ 02. Cyber Focus Timer</h3>
      <p>Pomodoro & deep-work intervals with ambient soundscapes, fullscreen HUD, and automatic session persistence.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📁 03. Project Matrix</h3>
      <p>Organize academic courses, research, and software projects with interactive subtask progress tracking.</p>
    </td>
    <td width="50%">
      <h3>🔥 04. Atomic Habits</h3>
      <p>Build unbreakable streaks with one-tap check-ins and timezone-safe consecutive day calculations.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📅 05. Timeline & Deadlines</h3>
      <p>High-stakes exam and assignment countdowns with live seconds tickers and visual urgency color shifts.</p>
    </td>
    <td width="50%">
      <h3>📊 06. Weekly Intelligence</h3>
      <p>7-day density charts, project hour breakdowns, and 30-day consistency score analytics.</p>
    </td>
  </tr>
</table>

---

## 📱 Multi-Device & Mobile Ready

StudyOS is engineered for fluid responsiveness across every screen size:
- 📱 **iPhone & Android Phones**: Adaptive 1-column layouts, touch-friendly hit areas, and bottom navigation bar with iOS safe-area support (`env(safe-area-inset-bottom)`).
- 💻 **iPad & Tablets**: Dynamic 2-column grids and split-view calendar views.
- 🖥️ **Mac & Desktops**: Ultra-wide cockpit view with persistent command sidebar and keyboard navigability.

---

## 🛠️ Tech Stack & Architecture

```
┌──────────────────────────────────────────────────────────┐
│                         StudyOS                          │
├────────────────────────────┬─────────────────────────────┤
│ Frontend Framework         │ React 18 + Vite 6           │
│ Styling & Motion           │ Tailwind CSS 3 + Vanilla CSS│
│ Icons & Components         │ Lucide React + Radix UI     │
│ Server State & Caching     │ TanStack Query v5           │
│ Routing                    │ React Router DOM v6         │
│ Database & Auth            │ Supabase (PostgreSQL + RLS) │
│ Analytics                  │ Vercel Web Analytics        │
└────────────────────────────┴─────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/codewithabhiishek/Study-OS.git
cd Study-OS
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🗄️ Supabase Database Setup

Run the SQL migration script in your Supabase **SQL Editor** (`supabase/migrations/0001_init.sql`):

```sql
-- Creates isolated tables with Row-Level Security (RLS) enabled
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT DEFAULT '📁',
  notes TEXT,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  is_top_three BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal',
  "order" INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  streak INT DEFAULT 0,
  completed_dates TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deadlines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  duration_minutes INT NOT NULL,
  session_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 Google OAuth Setup (Optional)

To enable **Sign in with Google**:
1. In [Supabase Dashboard](https://supabase.com/dashboard) &rarr; **Authentication** &rarr; **Providers** &rarr; **Google**.
2. Toggle **Enable Sign in with Google**.
3. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth 2.0 Client ID (Web Application)**.
4. Set **Authorized redirect URIs**:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
5. Paste **Client ID** & **Client Secret** into Supabase and click **Save**.

---

## 🚢 Production Build

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the Project (`https://github.com/codewithabhiishek/Study-OS/fork`)
2. Create your Feature Branch (`git checkout -b feature/CyberFeature`)
3. Commit your Changes (`git commit -m 'feat: add new cyber widget'`)
4. Push to the Branch (`git push origin feature/CyberFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

### Built with ⚡ by [Abhishek](https://github.com/codewithabhiishek)

*⚡ Congrats, you reached the footer. Now go study.*

</div>
