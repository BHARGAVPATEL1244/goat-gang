-- Create table for tracking user bumps
create table if not exists public.leaderboard_bumps (
  user_id text not null primary key,
  count integer default 1,
  last_bumped_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.leaderboard_bumps enable row level security;

-- Policy: Everyone can read
create policy "Public Read" on public.leaderboard_bumps for select using (true);

-- Policy: Service Role can write (Bot)
-- Since we use the Service Role Key, we bypass RLS automatically.
-- But if using Anon Key for testing, we'd need:
-- create policy "Anon Write" on public.leaderboard_bumps for all using (true);
-- However, for security, we rely on the Service Role bypass.
