-- StudyOS schema. Run this in the Supabase SQL editor (or via supabase CLI).
-- All app tables are scoped per authenticated user via RLS.

-- Helper: updated_at auto-touch trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ───────────────────────────── projects ─────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  emoji text,
  deadline date,
  notes text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
create policy "projects_select_own" on public.projects for select to authenticated using (user_id = auth.uid());
create policy "projects_insert_own" on public.projects for insert to authenticated with check (user_id = auth.uid());
create policy "projects_update_own" on public.projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "projects_delete_own" on public.projects for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── tasks ─────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  completed boolean not null default false,
  is_top_three boolean not null default false,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks(user_id);
create index if not exists tasks_project_idx on public.tasks(project_id);
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
create policy "tasks_select_own" on public.tasks for select to authenticated using (user_id = auth.uid());
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (user_id = auth.uid());
create policy "tasks_update_own" on public.tasks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── habits ─────────────────────────────
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  streak integer not null default 0,
  completed_dates text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits(user_id);
create trigger habits_set_updated_at before update on public.habits
  for each row execute function public.set_updated_at();

alter table public.habits enable row level security;
create policy "habits_select_own" on public.habits for select to authenticated using (user_id = auth.uid());
create policy "habits_insert_own" on public.habits for insert to authenticated with check (user_id = auth.uid());
create policy "habits_update_own" on public.habits for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habits_delete_own" on public.habits for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── deadlines ─────────────────────────────
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists deadlines_user_idx on public.deadlines(user_id);
create trigger deadlines_set_updated_at before update on public.deadlines
  for each row execute function public.set_updated_at();

alter table public.deadlines enable row level security;
create policy "deadlines_select_own" on public.deadlines for select to authenticated using (user_id = auth.uid());
create policy "deadlines_insert_own" on public.deadlines for insert to authenticated with check (user_id = auth.uid());
create policy "deadlines_update_own" on public.deadlines for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "deadlines_delete_own" on public.deadlines for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── focus_sessions ─────────────────────────────
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  project_name text not null,
  duration_minutes integer not null,
  session_date date not null default current_date,
  type text not null default 'pomodoro' check (type in ('pomodoro','deep_work','custom')),
  created_at timestamptz not null default now()
);
create index if not exists focus_sessions_user_idx on public.focus_sessions(user_id);
create index if not exists focus_sessions_date_idx on public.focus_sessions(session_date);

alter table public.focus_sessions enable row level security;
create policy "focus_sessions_select_own" on public.focus_sessions for select to authenticated using (user_id = auth.uid());
create policy "focus_sessions_insert_own" on public.focus_sessions for insert to authenticated with check (user_id = auth.uid());
create policy "focus_sessions_update_own" on public.focus_sessions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "focus_sessions_delete_own" on public.focus_sessions for delete to authenticated using (user_id = auth.uid());

-- ───────────────────────────── universities ─────────────────────────────
create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text,
  deadline date,
  status text not null default 'researching' check (status in ('researching','preparing','applied','accepted','rejected')),
  requirements jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists universities_user_idx on public.universities(user_id);
create trigger universities_set_updated_at before update on public.universities
  for each row execute function public.set_updated_at();

alter table public.universities enable row level security;
create policy "universities_select_own" on public.universities for select to authenticated using (user_id = auth.uid());
create policy "universities_insert_own" on public.universities for insert to authenticated with check (user_id = auth.uid());
create policy "universities_update_own" on public.universities for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "universities_delete_own" on public.universities for delete to authenticated using (user_id = auth.uid());
