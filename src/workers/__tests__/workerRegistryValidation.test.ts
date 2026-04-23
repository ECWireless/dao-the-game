// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerManifest } from '../../types';
import { validateWorkerPaymentRegistration } from '../../../api/_lib/workerRegistry';

function createManifest(input?: Partial<WorkerManifest['pricing']>): WorkerManifest {
  return {
    specVersion: 'dao-the-game.worker.v1',
    identity: {
      name: 'Probe Worker',
      handle: 'probe-worker',
      roleTag: 'frontend-engineer',
      bio: 'Probe worker bio',
      shortPitch: 'Probe worker pitch'
    },
    pricing: {
      asset: 'USDC',
      amount: '0.05',
      chargeModel: 'per_request_attempt',
      ...input
    }
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('validateWorkerPaymentRegistration', () => {
  it('skips the run payment probe for free workers', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));

    await expect(
      validateWorkerPaymentRegistration('https://worker.example.com', createManifest({ amount: '0' }))
    ).resolves.toBeUndefined();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects workers priced above the DAO cap', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));

    await expect(
      validateWorkerPaymentRegistration('https://worker.example.com', createManifest({ amount: '1.01' }))
    ).rejects.toMatchObject({
      status: 400,
      message: 'Worker pricing amount must be 1 USDC or less per request attempt.'
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('accepts a paid worker that returns a 402 challenge with a payment header', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        status: 402,
        headers: {
          'PAYMENT-REQUIRED': 'eyJwcm9iZSI6dHJ1ZX0='
        }
      })
    );

    await expect(
      validateWorkerPaymentRegistration('https://worker.example.com', createManifest())
    ).resolves.toBeUndefined();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(
      'https://worker.example.com/.well-known/dao-the-game/run'
    );
  });

  it('rejects a paid worker that does not challenge /run with 402', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    await expect(
      validateWorkerPaymentRegistration('https://worker.example.com', createManifest())
    ).rejects.toMatchObject({
      status: 400,
      message: 'Paid workers must return HTTP 402 Payment Required from /run when called without payment.'
    });
  });
});
