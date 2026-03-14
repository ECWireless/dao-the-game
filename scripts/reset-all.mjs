import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const LOCAL_STORAGE_KEYS = [
  'dao-the-game:state:v2',
  'dao-the-game:view-mode:v1'
];

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

async function confirmReset() {
  if (process.argv.includes('--yes') || process.argv.includes('-y')) {
    return true;
  }

  const rl = createInterface({ input, output });

  try {
    const answer = await rl.question(
      'This will permanently delete all players, progress events, progress summaries, saved game state, and Hats org metadata from the configured Neon database. Continue? [y/N] '
    );

    return /^y(?:es)?$/iu.test(answer.trim());
  } finally {
    rl.close();
  }
}

function getDatabaseUrl() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  return process.env.DATABASE_URL;
}

async function main() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    console.error('Missing DATABASE_URL. Set it in the environment, .env.local, or .env.');
    process.exitCode = 1;
    return;
  }

  const confirmed = await confirmReset();

  if (!confirmed) {
    console.log('Reset aborted.');
    return;
  }

  const sql = neon(databaseUrl);

  await sql`
    TRUNCATE TABLE org_role_hats, org_trees, game_state, progress_events, progress_summary, players CASCADE
  `;

  console.log('Neon data wiped.');
  console.log('Browser localStorage is not accessible from this script.');
  console.log('Also clear these keys in the browser if you want a true fresh start:');

  for (const key of LOCAL_STORAGE_KEYS) {
    console.log(`- ${key}`);
  }
}

void main().catch((error) => {
  console.error('Reset failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
