import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type OutboxRow = {
  id: string;
  phone: string;
  message: string;
  status: string;
};

const TEXT_LK_SEND_URL = 'https://app.text.lk/api/v3/sms/send';

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

async function sendViaTextLk(params: {
  apiToken: string;
  senderId: string;
  phone: string;
  message: string;
}) {
  const response = await fetch(TEXT_LK_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.apiToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      recipient: params.phone,
      sender_id: params.senderId,
      type: 'plain',
      message: params.message,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Text.lk HTTP ${response.status}: ${text}`);
  }

  return text;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const textLkApiToken = Deno.env.get('TEXT_LK_API_TOKEN');
  const textLkSenderId = Deno.env.get('TEXT_LK_SENDER_ID') ?? 'TextLKDemo';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase service configuration.' }, 500);
  }

  if (!textLkApiToken) {
    return jsonResponse({ error: 'Text.lk API token is not configured.' }, 503);
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
    return jsonResponse({ processed: 0, sent: 0, failed: 0, provider: 'text_lk' });
  }

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const providerResponse = await sendViaTextLk({
        apiToken: textLkApiToken,
        senderId: textLkSenderId,
        phone: row.phone,
        message: row.message,
      });

      const { error: updateError } = await supabase
        .from('sms_outbox')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          provider: 'text_lk',
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
          provider: 'text_lk',
          provider_response: {
            error: sendError instanceof Error ? sendError.message : 'Send failed.',
          },
        })
        .eq('id', row.id);
    }
  }

  return jsonResponse({ processed: rows.length, sent, failed, provider: 'text_lk' });
});
