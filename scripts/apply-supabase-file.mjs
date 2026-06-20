import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
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
loadEnvFile(resolve(repoRoot, 'expo-client/.env'));
loadEnvFile(resolve(repoRoot, 'expo-client/.env.production.local'));
loadEnvFile(resolve(repoRoot, '.env.local'));

const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN.');
  process.exit(1);
}

const relativePath = process.argv[2] ?? 'supabase/migrations/20260629_text_lk_sms.sql';
const sqlPath = resolve(repoRoot, relativePath);
const sql = readFileSync(sqlPath, 'utf8');

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const text = await response.text();
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${text}`);
  process.exit(1);
}

console.log(`Applied ${relativePath}.`);
