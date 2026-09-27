import './../bootstrap';

import { Worker } from 'bullmq';

import { claimAssetForHlsEncode, recordDeadLetterJob, setAssetHlsStatus } from '@cio/db/queries';
import { JOB_NAMES, QUEUE_NAMES, createRedisConnection } from '@cio/jobs';
import { ZHlsEncodePayload } from '@cio/jobs/payloads/media';
import { generateVideoDownloadPresignedUrls } from '@cio/core/utils/s3';
import { mintEncoderJobToken } from '@cio/core/services/assets/encoder-token';

import { errorMessage } from '../utils/cancel';
import { env } from '../config/env';
import { log } from '../utils/logger';
import { isFlyEncoderConfigured, startEncoderMachine } from '../services/fly-machines';

/**
 * Dispatches HLS encodes to the Fly encoder. This process keeps the database and
 * Redis credentials; the encoder gets only a presigned source URL and a job
 * token scoped to one asset, so ffmpeg never runs anywhere that can reach the
 * database.
 *
 * Dispatch is cheap — claim, presign, mint, start a machine — so concurrency
 * here is unrelated to how many encodes run in parallel.
 */
const concurrency = Number.parseInt(env.HLS_DISPATCH_CONCURRENCY ?? '4', 10) || 4;
const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.mediaHls,
  async (job) => {
    if (job.name !== JOB_NAMES.mediaHls.hlsEncode) {
      throw new Error(`Unknown hls job: ${job.name}`);
    }

    const { assetId, storageKey, actorContext } = ZHlsEncodePayload.parse(job.data);
    const orgId = actorContext.organizationId;

    if (!isFlyEncoderConfigured()) {
      log.warn('hls-dispatch-skipped', { assetId, reason: 'encoder not configured' });
      await setAssetHlsStatus(assetId, orgId, 'skipped');
      return { status: 'skipped' as const };
    }

    // Claiming here rather than in the encoder keeps the only writer of this
    // state on the trusted side, and stops two dispatchers starting two
    // machines for the same asset.
    const claimed = await claimAssetForHlsEncode(assetId, orgId);
    if (!claimed) {
      log.info('hls-dispatch-skipped', { assetId, reason: 'not claimable' });
      return { status: 'skipped' as const };
    }

    const token = mintEncoderJobToken({ assetId, organizationId: orgId });
    if (!token) {
      await setAssetHlsStatus(assetId, orgId, 'failed');
      throw new Error('HLS_SIGNING_SECRET is not set, so no job token could be minted');
    }

    const signedSources = await generateVideoDownloadPresignedUrls([storageKey]);
    const sourceUrl = signedSources[storageKey];
    if (!sourceUrl) {
      await setAssetHlsStatus(assetId, orgId, 'failed');
      throw new Error(`Could not sign the source object for asset ${assetId}`);
    }

    const machineId = await startEncoderMachine({
      CIO_ASSET_ID: assetId,
      CIO_JOB_TOKEN: token.token,
      CIO_SOURCE_URL: sourceUrl,
      CIO_API_URL: env.ENCODER_CALLBACK_API_URL!
    });

    return { status: 'dispatched' as const, machineId };
  },
  { connection, concurrency }
);

worker.on('failed', async (job, err) => {
  if (!job) return;

  log.error('hls-dispatch-failed', {
    jobName: job.name,
    bullmqJobId: job.id,
    attempt: job.attemptsMade,
    error: errorMessage(err)
  });

  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!isFinalAttempt) return;

  const data = job.data as { assetId?: string; actorContext?: { organizationId?: string } };
  const orgId = data?.actorContext?.organizationId;

  if (data?.assetId && orgId) {
    await setAssetHlsStatus(data.assetId, orgId, 'failed').catch(() => undefined);
  }

  await recordDeadLetterJob({
    organizationId: orgId ?? null,
    domain: 'media',
    runId: null,
    queueName: QUEUE_NAMES.mediaHls,
    jobName: job.name,
    bullmqJobId: job.id ?? null,
    payload: job.data as Record<string, unknown>,
    error: { code: 'HLS_DISPATCH_EXHAUSTED', message: errorMessage(err), stack: err.stack },
    attempts: job.attemptsMade
  });
});

worker.on('ready', () => log.info('hls-dispatch-ready', { concurrency, queue: QUEUE_NAMES.mediaHls }));
worker.on('error', (err) => log.error('hls-dispatch-error', { error: errorMessage(err) }));

const shutdown = async (signal: string) => {
  log.info('hls-dispatch-shutdown', { signal });
  await worker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
