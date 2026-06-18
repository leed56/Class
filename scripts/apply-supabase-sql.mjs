import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const projectRef = 'cqophpwbzuqyqhvpovzq';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(repoRoot, 'expo-client/.env.local'));
loadEnvFile(resolve(repoRoot, 'expo-client/.env.production.local'));
loadEnvFile(resolve(repoRoot, '.env.local'));

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at https://supabase.com/dashboard/account/tokens');
  console.error('Then add to expo-client/.env.local: SUPABASE_ACCESS_TOKEN=sbp_...');
  console.error('Or run: $env:SUPABASE_ACCESS_TOKEN="sbp_..."; node scripts/apply-supabase-sql.mjs');
  process.exit(1);
}

const sqlPath = resolve(repoRoot, 'supabase/apply_pending_migrations.sql');
const sql = readFileSync(sqlPath, 'utf8');

const chunks = [
  {
    name: 'hall_rent_ledger',
    marker: '-- === 20260626_hall_rent_ledger.sql ===',
    endMarker: '-- === 20260627_platform_admin_and_invites.sql ===',
  },
  {
    name: 'platform_admin_and_invites',
    marker: '-- === 20260627_platform_admin_and_invites.sql ===',
    endMarker: null,
  },
];

function extractChunk(fullSql, marker, endMarker) {
  const start = fullSql.indexOf(marker);
  if (start < 0) throw new Error(`Marker not found: ${marker}`);
  const bodyStart = start + marker.length;
  const end = endMarker ? fullSql.indexOf(endMarker, bodyStart) : fullSql.length;
  if (end < 0) throw new Error(`End marker not found: ${endMarker}`);
  return fullSql.slice(bodyStart, end).trim();
}

async function runQuery(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return text;
}

for (const chunk of chunks) {
  const query = extractChunk(sql, chunk.marker, chunk.endMarker);
  console.log(`Applying ${chunk.name}...`);
  await runQuery(query);
  console.log(`Applied ${chunk.name}.`);
}

console.log('All pending migrations applied.');
