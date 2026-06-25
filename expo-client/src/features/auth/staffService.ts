import { supabase } from '@/lib/supabase';
import { throwServiceError } from '@/i18n/serviceErrors';
import { WorkspaceRole } from '@/lib/database.types';

import { getCurrentWorkspace } from './authService';

export type WorkspaceStaffMember = {
  userId: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  createdAt: string;
};

type StaffRow = {
  user_id: string;
  email: string;
  full_name: string;
  role: WorkspaceRole;
  created_at: string;
};

function mapStaffRow(row: StaffRow): WorkspaceStaffMember {
  return {
    userId: row.user_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

export async function getCurrentWorkspaceRole(): Promise<WorkspaceRole | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const workspace = await getCurrentWorkspace();
  if (!workspace) return null;

  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as WorkspaceRole | undefined) ?? null;
}

export async function listWorkspaceStaff(): Promise<WorkspaceStaffMember[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const { data, error } = await supabase.rpc('list_workspace_staff', {
    p_workspace_id: workspace.id,
  });

  if (error) throw new Error(error.message);
  return ((data as StaffRow[] | null) ?? []).map(mapStaffRow);
}

export async function addStaffMemberByEmail(email: string, role: WorkspaceRole) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const { error } = await supabase.rpc('add_workspace_member_by_email', {
    p_workspace_id: workspace.id,
    p_email: email.trim(),
    p_role: role,
  });

  if (error) throw new Error(error.message);
}

export async function updateStaffMemberRole(userId: string, role: WorkspaceRole) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const { error } = await supabase.rpc('update_workspace_member_role', {
    p_workspace_id: workspace.id,
    p_user_id: userId,
    p_role: role,
  });

  if (error) throw new Error(error.message);
}

export async function removeStaffMember(userId: string) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throwServiceError('workspaceNotFound');

  const { error } = await supabase.rpc('remove_workspace_member', {
    p_workspace_id: workspace.id,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
}
