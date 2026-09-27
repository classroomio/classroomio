import { log } from '../utils/logger';
import { env } from '../config/env';

const FLY_API = 'https://api.machines.dev/v1';
/** A hung Fly API must not hold a dispatch slot, or the claim, indefinitely. */
const FLY_API_TIMEOUT_MS = 30_000;

export interface EncoderJobEnvironment {
  CIO_ASSET_ID: string;
  CIO_JOB_TOKEN: string;
  CIO_SOURCE_URL: string;
  CIO_API_URL: string;
}

/**
 * A machine created through the Machines API inherits nothing from `fly.toml`,
 * so anything the encoder reads from the environment has to be sent here.
 */
function buildMachineEnv(jobEnv: EncoderJobEnvironment): Record<string, string> {
  const maxSourceBytes = env.FLY_ENCODER_MAX_SOURCE_BYTES;

  return maxSourceBytes ? { ...jobEnv, CIO_MAX_SOURCE_BYTES: maxSourceBytes } : { ...jobEnv };
}

export function isFlyEncoderConfigured(): boolean {
  return Boolean(env.FLY_API_TOKEN && env.FLY_APP_NAME && env.FLY_ENCODER_IMAGE && env.ENCODER_CALLBACK_API_URL);
}

/**
 * Start one machine per encode and let it exit when finished.
 *
 * A machine per job rather than a long-lived worker, because an encode is a
 * discrete unit of work that can run for hours: a crashed job takes its machine
 * with it, a finished job stops costing money immediately, and nothing is
 * pooled across tenants. `restart.policy = no` means a job that dies is retried
 * by the queue, which knows how many attempts are left, rather than silently by
 * Fly.
 */
export async function startEncoderMachine(jobEnv: EncoderJobEnvironment): Promise<string> {
  if (!isFlyEncoderConfigured()) {
    throw new Error('Fly encoder is not configured');
  }

  const response = await fetch(`${FLY_API}/apps/${env.FLY_APP_NAME}/machines`, {
    method: 'POST',
    signal: AbortSignal.timeout(FLY_API_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${env.FLY_API_TOKEN}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      name: `encode-${jobEnv.CIO_ASSET_ID}`.slice(0, 63),
      region: env.FLY_ENCODER_REGION || undefined,
      config: {
        image: env.FLY_ENCODER_IMAGE,
        env: buildMachineEnv(jobEnv),
        auto_destroy: true,
        restart: { policy: 'no' },
        guest: {
          cpu_kind: 'performance',
          cpus: Number.parseInt(env.FLY_ENCODER_MACHINE_CPUS ?? '2', 10) || 2,
          memory_mb: Number.parseInt(env.FLY_ENCODER_MACHINE_MEMORY_MB ?? '4096', 10) || 4096
        }
      }
    })
  });

  const body = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;

  if (!response.ok || !body?.id) {
    throw new Error(`Fly machine create failed (${response.status}): ${body?.error ?? 'no machine id returned'}`);
  }

  log.info('encoder-machine-started', { machineId: body.id, assetId: jobEnv.CIO_ASSET_ID });

  return body.id;
}
