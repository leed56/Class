import { supabase } from '@/lib/supabase';
import { LanguageCode, InstituteType, WorkspaceRow } from '@/lib/database.types';

type AuthCredentials = {
  email: string;
  password: string;
};

type WorkspaceSetupInput = {
  name: string;
  defaultLanguage: LanguageCode;
};

export async function signInTeacher({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpTeacher({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOutTeacher() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentWorkspace(): Promise<WorkspaceRow | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.workspace_id) return null;

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', membership.workspace_id)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  return workspace as WorkspaceRow | null;
}

export async function createTeacherWorkspace({ name, defaultLanguage }: WorkspaceSetupInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Please sign in before creating a workspace.');

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      owner_id: user.id,
      name: name.trim(),
      default_language: defaultLanguage,
      plan: 'free',
    })
    .select('*')
    .single();

  if (workspaceError) throw workspaceError;

  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner',
  });

  if (memberError) throw memberError;
  return workspace as WorkspaceRow;
}

export async function getCurrentUserLanguage(): Promise<LanguageCode> {
  const workspace = await getCurrentWorkspace();
  return workspace?.default_language ?? 'en';
}

export type WorkspaceUpdateInput = {
  name?: string;
  defaultLanguage?: LanguageCode;
  instituteType?: InstituteType;
  admissionFeeLkr?: number;
  proRataEnabled?: boolean;
  minAttendanceForCertificate?: number;
  requireFeesClearForCertificate?: boolean;
  certificateSignatoryName?: string;
  certificateSignatoryTitle?: string;
  certificateCompletionBody?: string;
  certificateAchievementBody?: string;
  certificateFooterNote?: string;
};

export type TeacherProfileUpdateInput = {
  fullName?: string;
  phone?: string;
};

export async function updateWorkspace(input: WorkspaceUpdateInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Please sign in before updating workspace settings.');

  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Workspace not found.');

  const updates: {
    name?: string;
    default_language?: LanguageCode;
    institute_type?: InstituteType;
    admission_fee_lkr?: number;
    pro_rata_enabled?: boolean;
    min_attendance_for_certificate?: number;
    require_fees_clear_for_certificate?: boolean;
    certificate_signatory_name?: string;
    certificate_signatory_title?: string;
    certificate_completion_body?: string;
    certificate_achievement_body?: string;
    certificate_footer_note?: string;
  } = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) throw new Error('Institute name is required.');
    updates.name = trimmed;
  }
  if (input.defaultLanguage !== undefined) {
    updates.default_language = input.defaultLanguage;
  }
  if (input.instituteType !== undefined) {
    updates.institute_type = input.instituteType;
  }
  if (input.admissionFeeLkr !== undefined) {
    updates.admission_fee_lkr = Math.max(0, Math.round(input.admissionFeeLkr));
  }
  if (input.proRataEnabled !== undefined) {
    updates.pro_rata_enabled = input.proRataEnabled;
  }
  if (input.minAttendanceForCertificate !== undefined) {
    updates.min_attendance_for_certificate = Math.min(100, Math.max(0, Math.round(input.minAttendanceForCertificate)));
  }
  if (input.requireFeesClearForCertificate !== undefined) {
    updates.require_fees_clear_for_certificate = input.requireFeesClearForCertificate;
  }
  if (input.certificateSignatoryName !== undefined) {
    updates.certificate_signatory_name = input.certificateSignatoryName.trim();
  }
  if (input.certificateSignatoryTitle !== undefined) {
    updates.certificate_signatory_title = input.certificateSignatoryTitle.trim() || 'Director';
  }
  if (input.certificateCompletionBody !== undefined) {
    const trimmed = input.certificateCompletionBody.trim();
    if (!trimmed) throw new Error('Completion certificate wording is required.');
    updates.certificate_completion_body = trimmed;
  }
  if (input.certificateAchievementBody !== undefined) {
    const trimmed = input.certificateAchievementBody.trim();
    if (!trimmed) throw new Error('Achievement certificate wording is required.');
    updates.certificate_achievement_body = trimmed;
  }
  if (input.certificateFooterNote !== undefined) {
    updates.certificate_footer_note = input.certificateFooterNote.trim();
  }

  if (Object.keys(updates).length === 0) {
    return workspace;
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspace.id)
    .eq('owner_id', user.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as WorkspaceRow;
}

export async function updateTeacherProfile(input: TeacherProfileUpdateInput) {
  const metadata: Record<string, string> = {};

  if (input.fullName !== undefined) {
    const trimmed = input.fullName.trim();
    if (!trimmed) throw new Error('Display name is required.');
    metadata.full_name = trimmed;
  }

  if (input.phone !== undefined) {
    metadata.phone = input.phone.trim();
  }

  if (Object.keys(metadata).length === 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Please sign in before updating your profile.');
    return user;
  }

  const { data, error } = await supabase.auth.updateUser({ data: metadata });
  if (error) throw new Error(error.message);
  return data.user;
}
