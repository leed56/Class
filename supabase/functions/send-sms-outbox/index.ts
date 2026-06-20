import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type OutboxRow = {
  id: string;
  phone: string;
  message: string;
  status: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendViaNotifyLk(params: {
  userId: string;
  apiKey: string;
  senderId: string;
  phone: string;
  message: string;
}) {
  const url = new URL('https://app.notify.lk/api/v1/send');
  url.searchParams.set('user_id', params.userId);
  url.searchParams.set('api_key', params.apiKey);
  url.searchParams.set('sender_id', params.senderId);
  url.searchParams.set('to', params.phone);
  url.searchParams.set('message', params.message);

  const response = await fetch(url.toString(), { method: 'GET' });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Notify.lk HTTP ${response.status}: ${text}`);
  }

  return text;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const notifyUserId = Deno.env.get('NOTIFY_LK_USER_ID');
  const notifyApiKey = Deno.env.get('NOTIFY_LK_API_KEY');
  const notifySenderId = Deno.env.get('NOTIFY_LK_SENDER_ID') ?? 'NotifyDEMO';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase service configuration.' }, 500);
  }

  if (!notifyUserId || !notifyApiKey) {
    return jsonResponse({ error: 'Notify.lk credentials are not configured.' }, 503);
  }

  let phoneFilter: string | undefined;
  try {
    const body = request.method === 'POST' ? await request.json() : {};
    if (body && typeof body.phone === 'string' && body.phone.trim()) {
      phoneFilter = body.phone.trim();
    }
  } catch {
    phoneFilter = undefined;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let query = supabase
    .from('sms_outbox')
    .select('id, phone, message, status')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(phoneFilter ? 3 : 20);

  if (phoneFilter) {
    query = query.eq('phone', phoneFilter);
  }

  const { data, error } = await query;
  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  const rows = (data ?? []) as OutboxRow[];
  if (rows.length === 0) {
    return jsonResponse({ processed: 0, sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const providerResponse = await sendViaNotifyLk({
        userId: notifyUserId,
        apiKey: notifyApiKey,
        senderId: notifySenderId,
        phone: row.phone,
        message: row.message,
      });

      const { error: updateError } = await supabase
        .from('sms_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider_response: { raw: providerResponse },
        })
        .eq('id', row.id);

      if (updateError) throw updateError;
      sent += 1;
    } catch (sendError) {
      failed += 1;
      await supabase
        .from('sms_outbox')
        .update({
          status: 'failed',
          provider_response: {
            error: sendError instanceof Error ? sendError.message : 'Send failed.',
          },
        })
        .eq('id', row.id);
    }
  }

  return jsonResponse({ processed: rows.length, sent, failed });
});
