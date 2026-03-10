import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import type { GameStateSnapshot } from '../../src/contracts/gameState';
import type {
  PlayerRecord,
  ProgressSummaryRecord,
  StoredGameStateRecord
} from '../../src/contracts/player';
import { getDatabaseUrl } from './env.js';

type PlayerRow = {
  id: string;
  privy_user_id: string;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
};

type ProgressSummaryRow = {
  current_beat: string;
  current_scene_index: number;
  furthest_beat: string;
  furthest_scene_index: number;
  updated_at: string;
};

type GameStateRow = {
  snapshot_json: GameStateSnapshot | string;
  updated_at: string;
};

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;

function getSql(): SqlClient {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }

  return sqlClient;
}

function mapPlayer(row: PlayerRow): PlayerRecord {
  return {
    id: row.id,
    privyUserId: row.privy_user_id,
    walletAddress: row.wallet_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapProgressSummary(row: ProgressSummaryRow): ProgressSummaryRecord {
  return {
    currentBeat: row.current_beat,
    currentSceneIndex: row.current_scene_index,
    furthestBeat: row.furthest_beat,
    furthestSceneIndex: row.furthest_scene_index,
    updatedAt: row.updated_at
  };
}

function mapGameState(row: GameStateRow): StoredGameStateRecord {
  return {
    snapshot:
      typeof row.snapshot_json === 'string'
        ? (JSON.parse(row.snapshot_json) as GameStateSnapshot)
        : row.snapshot_json,
    updatedAt: row.updated_at
  };
}

export async function upsertPlayer(input: {
  privyUserId: string;
  walletAddress: string | null;
}): Promise<PlayerRecord> {
  const sql = getSql();

  const [player] = (await sql`
    INSERT INTO players (id, privy_user_id, wallet_address)
    VALUES (${randomUUID()}::uuid, ${input.privyUserId}, ${input.walletAddress})
    ON CONFLICT (privy_user_id) DO UPDATE SET
      wallet_address = COALESCE(EXCLUDED.wallet_address, players.wallet_address),
      updated_at = now()
    RETURNING
      id::text,
      privy_user_id,
      wallet_address,
      created_at::text,
      updated_at::text
  `) as PlayerRow[];

  return mapPlayer(player);
}

export async function getProgressSummary(playerId: string): Promise<ProgressSummaryRecord | null> {
  const sql = getSql();

  const [summary] = (await sql`
    SELECT
      current_beat,
      current_scene_index,
      furthest_beat,
      furthest_scene_index,
      updated_at::text
    FROM progress_summary
    WHERE player_id = ${playerId}::uuid
    LIMIT 1
  `) as ProgressSummaryRow[];

  return summary ? mapProgressSummary(summary) : null;
}

export async function getGameState(playerId: string): Promise<StoredGameStateRecord | null> {
  const sql = getSql();

  const [state] = (await sql`
    SELECT snapshot_json, updated_at::text
    FROM game_state
    WHERE player_id = ${playerId}::uuid
    LIMIT 1
  `) as GameStateRow[];

  return state ? mapGameState(state) : null;
}

export async function recordProgress(input: {
  playerId: string;
  beat: string;
  sceneIndex: number;
}): Promise<ProgressSummaryRecord> {
  const sql = getSql();

  const existingSummary = await getProgressSummary(input.playerId);

  if (
    existingSummary &&
    existingSummary.currentBeat === input.beat &&
    existingSummary.currentSceneIndex === input.sceneIndex
  ) {
    return existingSummary;
  }

  await sql`
    INSERT INTO progress_events (id, player_id, beat, scene_index)
    VALUES (${randomUUID()}::uuid, ${input.playerId}::uuid, ${input.beat}, ${input.sceneIndex})
  `;

  const [summary] = (await sql`
    INSERT INTO progress_summary (
      player_id,
      current_beat,
      current_scene_index,
      furthest_beat,
      furthest_scene_index
    )
    VALUES (
      ${input.playerId}::uuid,
      ${input.beat},
      ${input.sceneIndex},
      ${input.beat},
      ${input.sceneIndex}
    )
    ON CONFLICT (player_id) DO UPDATE SET
      current_beat = EXCLUDED.current_beat,
      current_scene_index = EXCLUDED.current_scene_index,
      furthest_beat = CASE
        WHEN EXCLUDED.current_scene_index >= progress_summary.furthest_scene_index
          THEN EXCLUDED.furthest_beat
        ELSE progress_summary.furthest_beat
      END,
      furthest_scene_index = GREATEST(
        progress_summary.furthest_scene_index,
        EXCLUDED.furthest_scene_index
      ),
      updated_at = now()
    RETURNING
      current_beat,
      current_scene_index,
      furthest_beat,
      furthest_scene_index,
      updated_at::text
  `) as ProgressSummaryRow[];

  return mapProgressSummary(summary);
}

export async function saveGameState(input: {
  playerId: string;
  snapshot: GameStateSnapshot;
}): Promise<StoredGameStateRecord> {
  const sql = getSql();

  const [state] = (await sql`
    INSERT INTO game_state (player_id, snapshot_json)
    VALUES (${input.playerId}::uuid, ${JSON.stringify(input.snapshot)}::jsonb)
    ON CONFLICT (player_id) DO UPDATE SET
      snapshot_json = EXCLUDED.snapshot_json,
      updated_at = now()
    RETURNING snapshot_json, updated_at::text
  `) as GameStateRow[];

  return mapGameState(state);
}

export async function resetPlayerState(input: {
  playerId: string;
  initialBeat: string;
  initialSceneIndex: number;
}): Promise<ProgressSummaryRecord> {
  const sql = getSql();

  await sql`
    DELETE FROM game_state
    WHERE player_id = ${input.playerId}::uuid
  `;

  const [summary] = (await sql`
    INSERT INTO progress_summary (
      player_id,
      current_beat,
      current_scene_index,
      furthest_beat,
      furthest_scene_index
    )
    VALUES (
      ${input.playerId}::uuid,
      ${input.initialBeat},
      ${input.initialSceneIndex},
      ${input.initialBeat},
      ${input.initialSceneIndex}
    )
    ON CONFLICT (player_id) DO UPDATE SET
      current_beat = EXCLUDED.current_beat,
      current_scene_index = EXCLUDED.current_scene_index,
      furthest_beat = CASE
        WHEN progress_summary.furthest_scene_index >= EXCLUDED.furthest_scene_index
          THEN progress_summary.furthest_beat
        ELSE EXCLUDED.furthest_beat
      END,
      furthest_scene_index = GREATEST(
        progress_summary.furthest_scene_index,
        EXCLUDED.furthest_scene_index
      ),
      updated_at = now()
    RETURNING
      current_beat,
      current_scene_index,
      furthest_beat,
      furthest_scene_index,
      updated_at::text
  `) as ProgressSummaryRow[];

  return mapProgressSummary(summary);
}
