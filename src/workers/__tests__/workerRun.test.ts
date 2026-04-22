import { afterEach, describe, expect, it, vi } from 'vitest';
import type { WorkerRunRequest } from '../../types';
import { runExternalWorker } from '../../../api/_lib/workerRun';

const requestBody: WorkerRunRequest = {
  specVersion: 'dao-the-game.run-request.v1',
  job: {
    requestId: 'test-request',
    requestKind: 'live-assignment',
    requestedAt: '2026-04-03T00:00:00.000Z',
    artifactType: 'conference-site',
    hatName: 'Frontend Engineer',
    brief: {
      clientName: 'Demo Client',
      mission: 'Ship a conference site.',
      requirements: ['Return a full HTML handoff.']
    },
    contract: {
      outputContentType: 'text/html'
    }
  }
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runExternalWorker', () => {
  it('rejects private worker origins before fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));

    await expect(runExternalWorker('https://localhost', requestBody)).rejects.toMatchObject({
      status: 502,
      message: 'External worker origin must use a public internet hostname.'
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects non-https worker origins before fetch', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('fetch should not be called'));

    await expect(runExternalWorker('http://example.com', requestBody)).rejects.toMatchObject({
      status: 502,
      message: 'External worker origin must use https.'
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
