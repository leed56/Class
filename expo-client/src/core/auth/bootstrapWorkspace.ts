import { getSupabase } from '@/lib/supabase';

type BootstrapInput = {
  userId: string;
  workspaceName: string;
  language?: 'en' | 'si' | 'ta';
};

export async function bootstrapWorkspace({ userId, workspaceName, language = 'en' }: BootstrapInput) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .insert({
      owner_id: userId,
      name: workspaceName,
      default_language: language,
    })
    .select('id, name, default_language')
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  const { error: memberError } = await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
  });

  if (memberError) {
    throw memberError;
  }

  return workspace;
}
