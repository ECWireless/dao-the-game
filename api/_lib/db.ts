import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import type { GameStateSnapshot } from '../../src/contracts/gameState';
import type { OrgRoleHatRecord, OrgTreeRecord } from '../../src/contracts/org';
import type {
  PlayerRecord,
  ProgressSummaryRecord,
  StoredGameStateRecord
} from '../../src/contracts/player';
import type { WorkerRegistryEntryRecord } from '../../src/contracts/workers';
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

type OrgTreeRow = {
  player_id: string;
  chain_id: number;
  top_hat_id: string;
  studio_name: string | null;
  wearer_address: string;
  eligibility_address: string;
  toggle_address: string;
  tx_hash: string;
  created_at: string;
  updated_at: string;
};

type OrgRoleHatRow = {
  player_id: string;
  role_id: string;
  role_name: string;
  chain_id: number;
  hat_id: string;
  admin_hat_id: string;
  eligibility_address: string;
  toggle_address: string;
  tx_hash: string;
  created_at: string;
  updated_at: string;
};

type WorkerRegistryRow = {
  id: string;
  worker_origin: string;
  erc8004_token_id: string;
  agent_card_uri: string;
  registration_chain_id: number;
  payment_chain_id: number;
  owner_address: string;
  engineer_email: string | null;
  availability: string;
  submitted_at: string;
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

function mapOrgTree(row: OrgTreeRow): OrgTreeRecord {
  return {
    playerId: row.player_id,
    chainId: row.chain_id,
    topHatId: row.top_hat_id,
    studioName: row.studio_name,
    wearerAddress: row.wearer_address,
    eligibilityAddress: row.eligibility_address,
    toggleAddress: row.toggle_address,
    txHash: row.tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapOrgRoleHat(row: OrgRoleHatRow): OrgRoleHatRecord {
  return {
    playerId: row.player_id,
    roleId: row.role_id,
    roleName: row.role_name,
    chainId: row.chain_id,
    hatId: row.hat_id,
    adminHatId: row.admin_hat_id,
    eligibilityAddress: row.eligibility_address,
    toggleAddress: row.toggle_address,
    txHash: row.tx_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapWorkerRegistryEntry(row: WorkerRegistryRow): WorkerRegistryEntryRecord {
  return {
    id: row.id,
    registryKey: `${row.registration_chain_id}:${row.erc8004_token_id}`,
    workerOrigin: row.worker_origin,
    erc8004TokenId: row.erc8004_token_id,
    agentCardUri: row.agent_card_uri,
    registrationChainId: row.registration_chain_id,
    paymentChainId: row.payment_chain_id,
    ownerAddress: row.owner_address,
    engineerEmail: row.engineer_email,
    availability: row.availability === 'paused' ? 'paused' : 'active',
    submittedAt: row.submitted_at,
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

export async function getOrgTree(playerId: string): Promise<OrgTreeRecord | null> {
  const sql = getSql();

  const [tree] = (await sql`
    SELECT
      player_id::text,
      chain_id,
      top_hat_id,
      studio_name,
      wearer_address,
      eligibility_address,
      toggle_address,
      tx_hash,
      created_at::text,
      updated_at::text
    FROM org_trees
    WHERE player_id = ${playerId}::uuid
    LIMIT 1
  `) as OrgTreeRow[];

  return tree ? mapOrgTree(tree) : null;
}

export async function getOrgRoleHats(playerId: string): Promise<OrgRoleHatRecord[]> {
  const sql = getSql();

  const rows = (await sql`
    SELECT
      player_id::text,
      role_id,
      role_name,
      chain_id,
      hat_id,
      admin_hat_id,
      eligibility_address,
      toggle_address,
      tx_hash,
      created_at::text,
      updated_at::text
    FROM org_role_hats
    WHERE player_id = ${playerId}::uuid
    ORDER BY role_id ASC
  `) as OrgRoleHatRow[];

  return rows.map(mapOrgRoleHat);
}

export async function listWorkerRegistryEntries(): Promise<WorkerRegistryEntryRecord[]> {
  const sql = getSql();

  const rows = (await sql`
    SELECT
      id::text,
      worker_origin,
      erc8004_token_id,
      agent_card_uri,
      registration_chain_id,
      payment_chain_id,
      owner_address,
      engineer_email,
      availability,
      submitted_at::text,
      updated_at::text
    FROM worker_registry
    ORDER BY submitted_at DESC
  `) as WorkerRegistryRow[];

  return rows.map(mapWorkerRegistryEntry);
}

export async function getWorkerRegistryEntryById(id: string): Promise<WorkerRegistryEntryRecord | null> {
  const sql = getSql();

  const [row] = (await sql`
    SELECT
      id::text,
      worker_origin,
      erc8004_token_id,
      agent_card_uri,
      registration_chain_id,
      payment_chain_id,
      owner_address,
      engineer_email,
      availability,
      submitted_at::text,
      updated_at::text
    FROM worker_registry
    WHERE id = ${id}::uuid
    LIMIT 1
  `) as WorkerRegistryRow[];

  return row ? mapWorkerRegistryEntry(row) : null;
}

export async function upsertWorkerRegistryEntry(input: {
  workerOrigin: string;
  erc8004TokenId: string;
  agentCardUri: string;
  registrationChainId: number;
  paymentChainId: number;
  ownerAddress: string;
  engineerEmail: string | null;
  availability?: 'active' | 'paused';
}): Promise<WorkerRegistryEntryRecord> {
  const sql = getSql();

  const [row] = (await sql`
    INSERT INTO worker_registry (
      id,
      worker_origin,
      erc8004_token_id,
      agent_card_uri,
      registration_chain_id,
      payment_chain_id,
      owner_address,
      engineer_email,
      availability
    )
    VALUES (
      ${randomUUID()}::uuid,
      ${input.workerOrigin},
      ${input.erc8004TokenId},
      ${input.agentCardUri},
      ${input.registrationChainId},
      ${input.paymentChainId},
      ${input.ownerAddress},
      ${input.engineerEmail},
      ${input.availability ?? 'active'}
    )
    ON CONFLICT (worker_origin) DO UPDATE SET
      erc8004_token_id = EXCLUDED.erc8004_token_id,
      agent_card_uri = EXCLUDED.agent_card_uri,
      registration_chain_id = EXCLUDED.registration_chain_id,
      payment_chain_id = EXCLUDED.payment_chain_id,
      owner_address = EXCLUDED.owner_address,
      engineer_email = COALESCE(EXCLUDED.engineer_email, worker_registry.engineer_email),
      availability = EXCLUDED.availability,
      updated_at = now()
    RETURNING
      id::text,
      worker_origin,
      erc8004_token_id,
      agent_card_uri,
      registration_chain_id,
      payment_chain_id,
      owner_address,
      engineer_email,
      availability,
      submitted_at::text,
      updated_at::text
  `) as WorkerRegistryRow[];

  return mapWorkerRegistryEntry(row);
}

export async function upsertOrgTree(input: {
  playerId: string;
  chainId: number;
  topHatId: string;
  studioName: string | null;
  wearerAddress: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
}): Promise<OrgTreeRecord> {
  const sql = getSql();

  const [tree] = (await sql`
    INSERT INTO org_trees (
      player_id,
      chain_id,
      top_hat_id,
      studio_name,
      wearer_address,
      eligibility_address,
      toggle_address,
      tx_hash
    )
    VALUES (
      ${input.playerId}::uuid,
      ${input.chainId},
      ${input.topHatId},
      ${input.studioName},
      ${input.wearerAddress},
      ${input.eligibilityAddress},
      ${input.toggleAddress},
      ${input.txHash}
    )
    ON CONFLICT (player_id) DO UPDATE SET
      chain_id = EXCLUDED.chain_id,
      top_hat_id = EXCLUDED.top_hat_id,
      studio_name = COALESCE(EXCLUDED.studio_name, org_trees.studio_name),
      wearer_address = EXCLUDED.wearer_address,
      eligibility_address = EXCLUDED.eligibility_address,
      toggle_address = EXCLUDED.toggle_address,
      tx_hash = EXCLUDED.tx_hash,
      updated_at = now()
    RETURNING
      player_id::text,
      chain_id,
      top_hat_id,
      studio_name,
      wearer_address,
      eligibility_address,
      toggle_address,
      tx_hash,
      created_at::text,
      updated_at::text
  `) as OrgTreeRow[];

  return mapOrgTree(tree);
}

export async function upsertOrgRoleHat(input: {
  playerId: string;
  roleId: string;
  roleName: string;
  chainId: number;
  hatId: string;
  adminHatId: string;
  eligibilityAddress: string;
  toggleAddress: string;
  txHash: string;
}): Promise<OrgRoleHatRecord> {
  const sql = getSql();

  const [roleHat] = (await sql`
    INSERT INTO org_role_hats (
      player_id,
      role_id,
      role_name,
      chain_id,
      hat_id,
      admin_hat_id,
      eligibility_address,
      toggle_address,
      tx_hash
    )
    VALUES (
      ${input.playerId}::uuid,
      ${input.roleId},
      ${input.roleName},
      ${input.chainId},
      ${input.hatId},
      ${input.adminHatId},
      ${input.eligibilityAddress},
      ${input.toggleAddress},
      ${input.txHash}
    )
    ON CONFLICT (player_id, role_id) DO UPDATE SET
      role_name = EXCLUDED.role_name,
      chain_id = EXCLUDED.chain_id,
      hat_id = EXCLUDED.hat_id,
      admin_hat_id = EXCLUDED.admin_hat_id,
      eligibility_address = EXCLUDED.eligibility_address,
      toggle_address = EXCLUDED.toggle_address,
      tx_hash = EXCLUDED.tx_hash,
      updated_at = now()
    RETURNING
      player_id::text,
      role_id,
      role_name,
      chain_id,
      hat_id,
      admin_hat_id,
      eligibility_address,
      toggle_address,
      tx_hash,
      created_at::text,
      updated_at::text
  `) as OrgRoleHatRow[];

  return mapOrgRoleHat(roleHat);
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
