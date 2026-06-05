-- Daily Luffy motivation messages, one per user per day.
create table if not exists public.luffy_motivations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists luffy_motivations_user_date_idx
  on public.luffy_motivations(user_id, date desc);

grant select, insert, update, delete on public.luffy_motivations to authenticated;
grant all on public.luffy_motivations to service_role;

alter table public.luffy_motivations enable row level security;

drop policy if exists "luffy_select_own" on public.luffy_motivations;
create policy "luffy_select_own" on public.luffy_motivations
  for select using (auth.uid() = user_id);

drop policy if exists "luffy_insert_own" on public.luffy_motivations;
create policy "luffy_insert_own" on public.luffy_motivations
  for insert with check (auth.uid() = user_id);
