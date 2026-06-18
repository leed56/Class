import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadEnv(envPath);
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('STATUS: missing supabase url or anon key in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function tableExists(table) {
  const { error } = await supabase.from(table).select('id').limit(1);
  if (!error) return true;
  if (error.code === 'PGRST205' || error.message.includes('does not exist')) return false;
  return `error:${error.message}`;
}

async function rpcExists(name, args = {}) {
  const { error } = await supabase.rpc(name, args);
  if (!error) return true;
  if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) return false;
  if (error.message.includes('Invite not found')) return true;
  if (error.message.includes('Platform admin access required')) return true;
  return `error:${error.message}`;
}

const result = {
  hall_bookings: await tableExists('hall_bookings'),
  hall_rent_invoices: await tableExists('hall_rent_invoices'),
  platform_admins: await tableExists('platform_admins'),
  platform_invites: await tableExists('platform_invites'),
  is_platform_admin_rpc: await rpcExists('is_platform_admin'),
  get_platform_invite_rpc: await rpcExists('get_platform_invite', { p_token: '000000000000000000000000' }),
};

console.log(JSON.stringify(result, null, 2));
