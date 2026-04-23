import { describe, expect, it } from 'vitest';
import type { WorkerRegistryEntry } from '../../contracts/workers';
import type { RoleTagId } from '../../types';
import { buildWorkerRosterWithAllowlist } from '../integration';
import { BUILTIN_WORKER_REGISTRY } from '../registry';

function createRegistryWorker(input: {
  id: string;
  registryKey: string;
  tokenId: string;
  roleTag: RoleTagId;
  name: string;
  handle: string;
}): WorkerRegistryEntry {
  return {
    id: input.id,
    registryKey: input.registryKey,
    workerOrigin: `https://${input.handle}.example.com`,
    erc8004TokenId: input.tokenId,
    agentCardUri: `ipfs://${input.id}`,
    registrationChainId: 8453,
    paymentChainId: 8453,
    ownerAddress: '0x1111111111111111111111111111111111111111',
    engineerEmail: null,
    availability: 'active',
    submittedAt: '2026-04-03T00:00:00.000Z',
    updatedAt: '2026-04-03T00:00:00.000Z',
    live: {
      manifest: {
        specVersion: 'dao-the-game.worker.v1',
        identity: {
          name: input.name,
          handle: input.handle,
          roleTag: input.roleTag,
          bio: `${input.name} bio`,
          shortPitch: `${input.name} pitch`
        },
        pricing: {
          asset: 'USDC',
          amount: '0.05',
          chargeModel: 'per_request_attempt'
        }
      },
      selfTest: {
        specVersion: 'dao-the-game.self-test.v1',
        ok: true,
        worker: {
          name: input.name,
          roleTag: input.roleTag
        },
        checks: {
          manifestReachable: true,
          profileReachable: true,
          runReachable: true
        }
      }
    }
  };
}

describe('buildWorkerRosterWithAllowlist', () => {
  it('replaces only the first frontend slot when one frontend worker is allowlisted', () => {
    const registryWorker = createRegistryWorker({
      id: 'registry-frontend-1',
      registryKey: '8453:17',
      tokenId: '17',
      roleTag: 'frontend-engineer',
      name: 'Clive Vector',
      handle: 'clive-vector'
    });

    const roster = buildWorkerRosterWithAllowlist(
      BUILTIN_WORKER_REGISTRY,
      ['8453:17'],
      [registryWorker]
    );

    expect(roster).toHaveLength(6);
    expect(roster.find((worker) => worker.id === 'worker-01')?.name).toBe('Clive Vector');
    expect(roster.find((worker) => worker.id === 'worker-02')?.name).toBe('Dorian Ash');
    expect(roster.find((worker) => worker.id === 'worker-01')?.registryRecordId).toBe(
      'registry-frontend-1'
    );
  });

  it('fills shared frontend slots in allowlist order', () => {
    const first = createRegistryWorker({
      id: 'registry-frontend-1',
      registryKey: '8453:17',
      tokenId: '17',
      roleTag: 'frontend-engineer',
      name: 'Clive Vector',
      handle: 'clive-vector'
    });
    const second = createRegistryWorker({
      id: 'registry-frontend-2',
      registryKey: '8453:19',
      tokenId: '19',
      roleTag: 'frontend-engineer',
      name: 'Nova Grid',
      handle: 'nova-grid'
    });

    const roster = buildWorkerRosterWithAllowlist(
      BUILTIN_WORKER_REGISTRY,
      ['8453:19', '8453:17'],
      [first, second]
    );

    expect(roster.find((worker) => worker.id === 'worker-01')?.name).toBe('Nova Grid');
    expect(roster.find((worker) => worker.id === 'worker-02')?.name).toBe('Clive Vector');
  });

  it('maps design workers to their fixed slots', () => {
    const uiWorker = createRegistryWorker({
      id: 'registry-ui-1',
      registryKey: '8453:31',
      tokenId: '31',
      roleTag: 'ui-designer',
      name: 'Interface Tide',
      handle: 'interface-tide'
    });
    const brandWorker = createRegistryWorker({
      id: 'registry-brand-1',
      registryKey: '8453:32',
      tokenId: '32',
      roleTag: 'brand-designer',
      name: 'Banner Static',
      handle: 'banner-static'
    });

    const roster = buildWorkerRosterWithAllowlist(
      BUILTIN_WORKER_REGISTRY,
      ['8453:31', '8453:32'],
      [uiWorker, brandWorker]
    );

    expect(roster.find((worker) => worker.id === 'worker-03')?.name).toBe('Interface Tide');
    expect(roster.find((worker) => worker.id === 'worker-04')?.name).toBe('Banner Static');
  });
});
