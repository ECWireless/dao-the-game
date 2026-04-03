import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function loadEnvFile(filename) {
  const filePath = path.join(projectRoot, filename);

  if (!existsSync(filePath)) {
    return;
  }

  const raw = readFileSync(filePath, 'utf8');

  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }
}

function getDatabaseUrl() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  return process.env.DATABASE_URL;
}

async function runMigrations() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL. Set it in the environment, .env.local, or .env.');
  }

  const sql = neon(databaseUrl);

  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id uuid PRIMARY KEY,
      privy_user_id text NOT NULL UNIQUE,
      wallet_address text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS progress_events (
      id uuid PRIMARY KEY,
      player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      beat text NOT NULL,
      scene_index integer NOT NULL,
      occurred_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS progress_events_player_occurred_idx
    ON progress_events (player_id, occurred_at DESC)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS progress_summary (
      player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      current_beat text NOT NULL,
      current_scene_index integer NOT NULL,
      furthest_beat text NOT NULL,
      furthest_scene_index integer NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS game_state (
      player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      snapshot_json jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS org_trees (
      player_id uuid PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      chain_id integer NOT NULL,
      top_hat_id text NOT NULL,
      studio_name text,
      wearer_address text NOT NULL,
      eligibility_address text NOT NULL,
      toggle_address text NOT NULL,
      tx_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS org_trees_top_hat_idx
    ON org_trees (top_hat_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS org_role_hats (
      player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      role_id text NOT NULL,
      role_name text NOT NULL,
      chain_id integer NOT NULL,
      hat_id text NOT NULL,
      admin_hat_id text NOT NULL,
      eligibility_address text NOT NULL,
      toggle_address text NOT NULL,
      tx_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (player_id, role_id)
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS org_role_hats_hat_idx
    ON org_role_hats (hat_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS worker_registry (
      id uuid PRIMARY KEY,
      worker_origin text NOT NULL UNIQUE,
      erc8004_token_id text NOT NULL,
      agent_card_uri text NOT NULL,
      registration_chain_id integer NOT NULL,
      payment_chain_id integer NOT NULL,
      owner_address text NOT NULL,
      engineer_email text,
      availability text NOT NULL DEFAULT 'active',
      submitted_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS worker_registry_chain_token_idx
    ON worker_registry (registration_chain_id, erc8004_token_id)
  `;

  await sql`
    UPDATE worker_registry
    SET availability = 'active'
    WHERE availability NOT IN ('active', 'paused')
  `;

  await sql`
    ALTER TABLE worker_registry
    DROP CONSTRAINT IF EXISTS worker_registry_availability_check
  `;

  await sql`
    ALTER TABLE worker_registry
    ADD CONSTRAINT worker_registry_availability_check
    CHECK (availability IN ('active', 'paused'))
  `;

  console.log('Database schema is up to date.');
}

void runMigrations().catch((error) => {
  console.error('Migration failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
