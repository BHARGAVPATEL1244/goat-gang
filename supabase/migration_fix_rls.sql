-- Fix RLS Policy for Leaderboard Bumps
-- We previously only created a Read policy. We need a Write policy.
-- If you are using the Service Role Key, this isn't strictly needed, but it fixes the error if using Anon Key.

create policy "Enable Insert/Update for All" 
on public.leaderboard_bumps 
for all 
using (true) 
with check (true);
