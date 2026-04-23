import type { ArtifactDeployEvent, ArtifactDeployRequest } from '../../src/contracts/artifact';
import { buildWorkerPaymentPlanFromPipeline } from '../../src/workers/paymentPlan.js';
import { generateConferenceSiteArtifactWithWorkers } from '../_lib/conference-site-generation.js';
import { deployArtifactToPinata, canUsePinataDeploys } from '../_lib/pinata.js';
import { handleRouteError, HttpError, options, parseOptionalJsonBody, withCors } from '../_lib/http.js';
import { requirePrivyAuth } from '../_lib/privy.js';
import { createWorkerPaymentExecutionContext } from '../_lib/workerPayments.js';

export const runtime = 'nodejs';

export const OPTIONS = options;

function validateRequestBody(body: ArtifactDeployRequest | null): asserts body is ArtifactDeployRequest {
  if (
    !body ||
    typeof body !== 'object' ||
    !body.artifact ||
    typeof body.artifact !== 'object' ||
    typeof body.artifact.artifactType !== 'string' ||
    typeof body.artifact.profileTag !== 'string' ||
    typeof body.artifact.siteTitle !== 'string' ||
    typeof body.artifact.ensName !== 'string' ||
    !Array.isArray(body.artifact.notes) ||
    typeof body.artifact.siteDocument !== 'string' ||
    !body.artifact.siteDocument.trim() ||
    !body.artifact.provenance ||
    typeof body.artifact.provenance !== 'object'
  ) {
    throw new HttpError(400, 'A valid generated artifact payload is required.');
  }

  const provenance = body.artifact.provenance as Record<string, unknown>;

  if (
    typeof provenance.studioName !== 'string' ||
    !provenance.studioName.trim() ||
    (provenance.cycle !== 1 && provenance.cycle !== 2) ||
    typeof provenance.briefId !== 'string' ||
    !provenance.briefId.trim() ||
    provenance.artifactType !== body.artifact.artifactType
  ) {
    throw new HttpError(400, 'Artifact provenance is missing required fields.');
  }

  if (body.workerPayments) {
    if (
      typeof body.workerPayments !== 'object' ||
      (body.workerPayments.mode !== 'approve-all' &&
        body.workerPayments.mode !== 'demo-fallback')
    ) {
      throw new HttpError(400, 'Worker payment preferences are invalid.');
    }

    if (
      body.workerPayments.mode === 'approve-all' &&
      (typeof body.workerPayments.walletAddress !== 'string' ||
        !body.workerPayments.walletAddress.trim())
    ) {
      throw new HttpError(400, 'A payer wallet address is required to approve paid worker stages.');
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { user, identityToken } = await requirePrivyAuth(request);
    const body = await parseOptionalJsonBody<ArtifactDeployRequest>(request);

    validateRequestBody(body);

    const paymentPlan = body.generationInput
      ? buildWorkerPaymentPlanFromPipeline(
          body.generationInput.result.pipeline?.stages,
          body.generationInput.roles,
          body.generationInput.workers
        )
      : null;

    if (paymentPlan?.requiresApproval && !body.workerPayments) {
      throw new HttpError(
        400,
        'Worker payment approval is required before the paid line can start.'
      );
    }

    const workerPaymentContext =
      body.generationInput && body.workerPayments
        ? await createWorkerPaymentExecutionContext({
            user,
            identityToken,
            preference: body.workerPayments
          })
        : null;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const writeEvent = (event: ArtifactDeployEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };
        const requestStartedAt = Date.now();

        void (async () => {
          try {
            writeEvent({
              type: 'generation-start',
              cycle: body.generationInput?.cycle,
              mode: body.generationInput ? 'workers' : 'deterministic',
              model: body.generationInput ? 'stage-routed' : null
            });

            const generationResult = body.generationInput
              ? await generateConferenceSiteArtifactWithWorkers(
                  body.generationInput,
                  body.artifact,
                  writeEvent,
                  workerPaymentContext
                )
              : { artifact: body.artifact, usedFallback: false };

            console.info(
              `[artifact timing] generation finished in ${Date.now() - requestStartedAt}ms`
            );

            writeEvent({
              type: 'artifact-generated',
              artifact: generationResult.artifact,
              usedFallback: generationResult.usedFallback
            });

            const shouldDeployToPinata =
              canUsePinataDeploys() || process.env.NODE_ENV === 'production';

            const artifact = shouldDeployToPinata
              ? await (async () => {
                  const publishStartedAt = Date.now();

                  writeEvent({
                    type: 'publishing-start',
                    destination: 'pinata'
                  });

                  const deployedArtifact = await deployArtifactToPinata(generationResult.artifact);
                  console.info(
                    `[artifact timing] publishing finished in ${Date.now() - publishStartedAt}ms`
                  );
                  return deployedArtifact;
                })()
              : generationResult.artifact;

            writeEvent({
              type: 'artifact-deployed',
              artifact
            });

            console.info(
              `[artifact timing] full deploy route finished in ${Date.now() - requestStartedAt}ms`
            );
          } catch (error) {
            console.error(error);
            writeEvent({
              type: 'error',
              error:
                process.env.NODE_ENV !== 'production' && error instanceof Error
                  ? error.message
                  : 'Artifact deployment failed.'
            });
          } finally {
            controller.close();
          }
        })();
      }
    });

    return withCors(
      request,
      new Response(stream, {
        headers: {
          'content-type': 'application/x-ndjson; charset=utf-8',
          'cache-control': 'no-cache, no-transform'
        }
      })
    );
  } catch (error) {
    return handleRouteError(request, error);
  }
}
