import { AcademySector } from '@/features/courses/slCourseModel';
import { throwServiceError } from '@/i18n/serviceErrors';
import { InstituteType } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type PlatformWorkspace = {
  workspaceId: string;
  workspaceName: string;
  instituteType: InstituteType;
  academySector: string | null;
  ownerEmail: string;
  memberCount: number;
  createdAt: string;
};

export type PlatformInvite = {
  id: string;
  token: string;
  email: string | null;
  instituteType: InstituteType;
  academySector: string | null;
  workspaceNameHint: string | null;
  note: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
};

export type PlatformInvitePreset = {
  instituteType: InstituteType;
  academySector: string | null;
  workspaceNameHint: string | null;
};

export async function isPlatformAdmin() {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) return false;
  return Boolean(data);
}

export async function listPlatformWorkspaces(): Promise<PlatformWorkspace[]> {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('list_platform_workspaces');
  if (error) throw new Error(error.message);

  return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    workspaceId: String(row.workspace_id),
    workspaceName: String(row.workspace_name),
    instituteType: row.institute_type as InstituteType,
    academySector: row.academy_sector ? String(row.academy_sector) : null,
    ownerEmail: String(row.owner_email ?? ''),
    memberCount: Number(row.member_count ?? 0),
    createdAt: String(row.created_at),
  }));
}

export async function listPlatformInvites(): Promise<PlatformInvite[]> {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('list_platform_invites');
  if (error) throw new Error(error.message);

  return ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
    id: String(row.id),
    token: String(row.token),
    email: row.email ? String(row.email) : null,
    instituteType: row.institute_type as InstituteType,
    academySector: row.academy_sector ? String(row.academy_sector) : null,
    workspaceNameHint: row.workspace_name_hint ? String(row.workspace_name_hint) : null,
    note: row.note ? String(row.note) : null,
    usedAt: row.used_at ? String(row.used_at) : null,
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
  }));
}

export async function createPlatformInvite(input: {
  instituteType: InstituteType;
  academySector?: AcademySector | null;
  workspaceNameHint?: string;
  email?: string;
  note?: string;
  expiresDays?: number;
}) {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('create_platform_invite', {
    p_institute_type: input.instituteType,
    p_academy_sector: input.academySector ?? null,
    p_workspace_name_hint: input.workspaceNameHint?.trim() || null,
    p_email: input.email?.trim() || null,
    p_note: input.note?.trim() || null,
    p_expires_days: input.expiresDays ?? 14,
  });

  if (error) throw new Error(error.message);
  return data as { token: string };
}

export async function getPlatformInvite(token: string): Promise<PlatformInvitePreset> {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('get_platform_invite', { p_token: token });
  if (error) throw new Error(error.message);

  const row = data as Record<string, unknown>;
  return {
    instituteType: row.institute_type as InstituteType,
    academySector: row.academy_sector ? String(row.academy_sector) : null,
    workspaceNameHint: row.workspace_name_hint ? String(row.workspace_name_hint) : null,
  };
}

export async function consumePlatformInvite(token: string): Promise<PlatformInvitePreset> {
  const supabase = getSupabase();
  if (!supabase) throwServiceError('supabaseNotConfigured');

  const { data, error } = await supabase.rpc('consume_platform_invite', { p_token: token });
  if (error) throw new Error(error.message);

  const row = data as Record<string, unknown>;
  return {
    instituteType: row.institute_type as InstituteType,
    academySector: row.academy_sector ? String(row.academy_sector) : null,
    workspaceNameHint: row.workspace_name_hint ? String(row.workspace_name_hint) : null,
  };
}

export function buildInviteUrl(token: string) {
  const path = `/auth/signup?invite=${encodeURIComponent(token)}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://class-theta-eight.vercel.app${path}`;
}
