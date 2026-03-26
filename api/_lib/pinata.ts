import type { ArtifactBundle } from '../../src/types';
import { getPinataGatewayBaseUrl, getPinataJwt } from './env.js';
import { HttpError } from './http.js';

type PinataFolderUploadResponse = {
  IpfsHash: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function buildFolderName(artifact: ArtifactBundle): string {
  const studioSlug = slugify(artifact.provenance.studioName) || 'ghost-studio';
  const titleSlug = slugify(artifact.siteTitle) || 'assembled-site';
  return `${studioSlug}-${artifact.profileTag}-${titleSlug}`.slice(0, 96);
}

function buildArtifactManifest(artifact: ArtifactBundle): string {
  return JSON.stringify(
    {
      artifactType: artifact.artifactType,
      profileTag: artifact.profileTag,
      siteTitle: artifact.siteTitle,
      ensName: artifact.ensName,
      notes: artifact.notes,
      provenance: artifact.provenance,
      workerTrace: artifact.workerTrace
    },
    null,
    2
  );
}

function parsePinataError(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === 'object' &&
    'error' in payload &&
    typeof payload.error === 'object' &&
    payload.error &&
    'reason' in payload.error &&
    typeof payload.error.reason === 'string'
  ) {
    return payload.error.reason;
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return null;
}

export function canUsePinataDeploys(): boolean {
  return Boolean(getPinataJwt());
}

export async function deployArtifactToPinata(artifact: ArtifactBundle): Promise<ArtifactBundle> {
  const pinataJwt = getPinataJwt();

  if (!pinataJwt) {
    throw new HttpError(500, 'Pinata deployment is not configured for this environment.');
  }

  const folderName = buildFolderName(artifact);
  const formData = new FormData();

  formData.append(
    'file',
    new Blob([artifact.siteDocument], { type: 'text/html;charset=utf-8' }),
    `${folderName}/index.html`
  );
  formData.append(
    'file',
    new Blob([buildArtifactManifest(artifact)], { type: 'application/json;charset=utf-8' }),
    `${folderName}/artifact.json`
  );
  formData.append(
    'pinataMetadata',
    JSON.stringify({
      name: folderName
    })
  );
  formData.append(
    'pinataOptions',
    JSON.stringify({
      cidVersion: 1
    })
  );

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${pinataJwt}`
    },
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = parsePinataError(payload) ?? 'Pinata rejected the artifact upload.';
    throw new HttpError(502, message);
  }

  const payload = (await response.json()) as PinataFolderUploadResponse;
  const cid = payload.IpfsHash;

  if (!cid) {
    throw new HttpError(502, 'Pinata did not return an IPFS content identifier.');
  }

  const gatewayBaseUrl = getPinataGatewayBaseUrl();
  const publicUrl = gatewayBaseUrl ? `${gatewayBaseUrl}/ipfs/${cid}` : `ipfs://${cid}`;

  return {
    ...artifact,
    cid,
    publicUrl,
    previewUrl: gatewayBaseUrl ? publicUrl : artifact.previewUrl
  };
}
