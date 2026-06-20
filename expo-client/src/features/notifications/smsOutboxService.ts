import { getSupabase } from '@/lib/supabase';

export async function flushQueuedParentOtpSms(phone?: string) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false as const, reason: 'Supabase is not configured.' };

  const { data, error } = await supabase.functions.invoke('send-sms-outbox', {
    body: phone ? { phone } : {},
  });

  if (error) {
    return { ok: false as const, reason: error.message };
  }

  return { ok: true as const, data };
}
