import type { EncoderConfig } from './config';

export interface FinalizeInput {
  manifestPath: string;
  audioPath: string | null;
  renditions: string[];
  sourceWidth: number;
  sourceHeight: number;
  durationSeconds: number;
}

/**
 * The encoder's only channel to ClassroomIO. Every call carries the job token,
 * which names the asset — so no request here passes an asset id, and a token
 * cannot be pointed at a different asset.
 */
export class EncoderApi {
  constructor(private readonly config: EncoderConfig) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.config.apiUrl}/internal/encoder${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.jobToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const json = (await response.json().catch(() => null)) as { success?: boolean; data?: T; error?: string } | null;

    if (!response.ok || !json?.success) {
      throw new Error(`${path} failed (${response.status}): ${json?.error ?? 'unknown error'}`);
    }

    return json.data as T;
  }

  /** Presign the output objects. Requested in batches so a long ladder stays under the API's cap. */
  async presignOutputs(paths: string[]): Promise<Record<string, string>> {
    const BATCH = 1000;
    const urls: Record<string, string> = {};

    for (let index = 0; index < paths.length; index += BATCH) {
      const batch = paths.slice(index, index + BATCH);
      const result = await this.post<{ urls: Record<string, string> }>('/outputs/presign', { paths: batch });
      Object.assign(urls, result.urls);
    }

    return urls;
  }

  async reportProgress(stage: string, percent: number): Promise<void> {
    await this.post('/progress', { stage, percent }).catch(() => undefined);
  }

  async finalize(input: FinalizeInput): Promise<void> {
    await this.post('/finalize', input);
  }

  async fail(reason: string): Promise<void> {
    await this.post('/fail', { reason: reason.slice(0, 2000) }).catch(() => undefined);
  }
}
