-- Tavern Table: the database setup for accounts.
-- Run it in Supabase: SQL Editor → New query → paste all of this → Run. It's safe to run again.
--
-- One table, `saves`: one row per player, holding their game data (party, combat, roll log) as JSON,
-- the same shape the page keeps in the browser. Device settings (scene, dice skin) are never sent here.

create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,   -- deleting an account deletes its save
  game       jsonb not null check (pg_column_size(game) < 200000),           -- a save is a few KB; this stops abuse
  updated_at timestamptz not null default now()
);

-- Row Level Security: with it on, nobody can read or change any row unless a policy below allows it.
alter table public.saves enable row level security;

-- Signed-in players can see, add, change and delete only their own row.
drop policy if exists "read own save"   on public.saves;
drop policy if exists "add own save"    on public.saves;
drop policy if exists "change own save" on public.saves;
drop policy if exists "delete own save" on public.saves;
create policy "read own save"   on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "add own save"    on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "change own save" on public.saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own save" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

-- Signed-out visitors get no access to this table at all; signed-in players get only what the policies allow.
revoke all on public.saves from anon;
grant select, insert, update, delete on public.saves to authenticated;
