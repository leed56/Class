import { supabase } from '@/lib/supabase';
import { LanguageCode, WorkspaceRow } from '@/lib/database.types';

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

export async function getCurrentWorkspace() {
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
