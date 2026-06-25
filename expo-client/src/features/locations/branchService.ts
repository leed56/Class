import { getCurrentWorkspace } from '@/features/auth/authService';
import { throwServiceError } from '@/i18n/serviceErrors';
import { BranchRow, HallRow } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

import { Branch, Hall, HallOption } from './models';

function mapBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    active: row.active,
    createdAt: row.created_at,
  };
}

function mapHall(row: HallRow, branchName: string): Hall {
  return {
    id: row.id,
    branchId: row.branch_id,
    branchName,
    name: row.name,
    capacity: row.capacity,
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function ensureDefaultLocationSetup() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: branches, error } = await supabase
    .from('branches')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .limit(1);

  if (error) throw new Error(error.message);
  if ((branches ?? []).length > 0) return branches?.[0]?.id ?? null;

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert({
      workspace_id: workspace.id,
      name: 'Main branch',
      active: true,
    })
    .select('*')
    .single();

  if (branchError) throw new Error(branchError.message);

  const { error: hallError } = await supabase.from('halls').insert({
    workspace_id: workspace.id,
    branch_id: branch.id,
    name: 'Main hall',
    active: true,
  });

  if (hallError) throw new Error(hallError.message);
  return branch.id as string;
}

export async function listBranches(includeInactive = false) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase.from('branches').select('*').eq('workspace_id', workspace.id).order('name');
  if (!includeInactive) query = query.eq('active', true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as BranchRow[]).map(mapBranch);
}

export async function createBranch(name: string, address?: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const trimmed = name.trim();
  if (!trimmed) throwServiceError('branchNameRequired');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('branches')
    .insert({
      workspace_id: workspace.id,
      name: trimmed,
      address: address?.trim() || null,
      active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return mapBranch(data as BranchRow);
}

export async function updateBranch(branchId: string, input: { name?: string; address?: string }) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const updates: { name?: string; address?: string | null } = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throwServiceError('branchNameRequired');
    updates.name = trimmed;
  }
  if (input.address !== undefined) updates.address = input.address.trim() || null;

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('branches')
    .update(updates)
    .eq('workspace_id', workspace.id)
    .eq('id', branchId)
    .eq('active', true)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('branchNotFound');
  return mapBranch(data as BranchRow);
}

export async function archiveBranch(branchId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('branches')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', branchId)
    .eq('active', true)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('branchNotFoundOrArchived');
}

export async function listHalls(branchId?: string, includeInactive = false) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  let query = supabase
    .from('halls')
    .select('*, branches!inner(name)')
    .eq('workspace_id', workspace.id)
    .order('name');

  if (branchId) query = query.eq('branch_id', branchId);
  if (!includeInactive) query = query.eq('active', true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const branchName =
      typeof row.branches === 'object' && row.branches && 'name' in row.branches
        ? String(row.branches.name)
        : 'Branch';
    return mapHall(row as HallRow, branchName);
  });
}

export async function createHall(branchId: string, name: string, capacity?: number) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const trimmed = name.trim();
  if (!trimmed) throwServiceError('hallNameRequired');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('halls')
    .insert({
      workspace_id: workspace.id,
      branch_id: branchId,
      name: trimmed,
      capacity: capacity && capacity > 0 ? Math.round(capacity) : null,
      active: true,
    })
    .select('*, branches!inner(name)')
    .single();

  if (error) throw new Error(error.message);
  const branchName =
    typeof data.branches === 'object' && data.branches && 'name' in data.branches
      ? String(data.branches.name)
      : 'Branch';
  return mapHall(data as HallRow, branchName);
}

export async function updateHall(
  hallId: string,
  input: { name?: string; capacity?: number | null },
) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const updates: { name?: string; capacity?: number | null } = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throwServiceError('hallNameRequired');
    updates.name = trimmed;
  }
  if (input.capacity !== undefined) {
    updates.capacity = input.capacity && input.capacity > 0 ? Math.round(input.capacity) : null;
  }

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('halls')
    .update(updates)
    .eq('workspace_id', workspace.id)
    .eq('id', hallId)
    .eq('active', true)
    .select('*, branches!inner(name)')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('hallRecordNotFound');
  const branchName =
    typeof data.branches === 'object' && data.branches && 'name' in data.branches
      ? String(data.branches.name)
      : 'Branch';
  return mapHall(data as HallRow, branchName);
}

export async function archiveHall(hallId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase
    .from('halls')
    .update({ active: false })
    .eq('workspace_id', workspace.id)
    .eq('id', hallId)
    .eq('active', true)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throwServiceError('hallRecordNotFoundOrArchived');
}

export async function listHallOptions(): Promise<HallOption[]> {
  await ensureDefaultLocationSetup();
  const halls = await listHalls();
  return halls.map((hall) => ({
    id: hall.id,
    label: `${hall.branchName} • ${hall.name}`,
    branchId: hall.branchId,
    branchName: hall.branchName,
    hallName: hall.name,
  }));
}

export async function getHallById(hallId: string) {
  const halls = await listHalls(undefined, true);
  return halls.find((hall) => hall.id === hallId) ?? null;
}

export async function getHallLabel(hallId: string | null | undefined) {
  if (!hallId) return null;
  const hall = await getHallById(hallId);
  if (!hall) return null;
  return `${hall.branchName} • ${hall.name}`;
}
