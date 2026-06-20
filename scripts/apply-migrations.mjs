/**
 * Apply pending Supabase migrations when SUPABASE_DB_URL is set.
 * Usage: SUPABASE_DB_URL="postgresql://..." node scripts/apply-migrations.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
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
loadEnvFile(resolve(repoRoot, '.env.local'));

const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL. Add your Supabase direct connection string, then re-run.');
  console.error('Or paste supabase/apply_pending_migrations.sql into the Supabase SQL Editor.');
  process.exit(1);
}

const sqlPath = resolve(repoRoot, 'supabase/apply_pending_migrations.sql');
const sql = readFileSync(sqlPath, 'utf8');
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log('Applied pending migrations successfully.');
} catch (error) {
  console.error('Migration failed:', error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await client.end();
}
