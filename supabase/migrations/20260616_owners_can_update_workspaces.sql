-- Allow workspace owners to update institute name and settings.
drop policy if exists "Owners can update own workspaces" on public.workspaces;
create policy "Owners can update own workspaces" on public.workspaces
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
