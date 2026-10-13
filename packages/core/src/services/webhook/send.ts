import http from 'node:http';
import https from 'node:https';

import { WEBHOOK_REQUEST_TIMEOUT_MS, WEBHOOK_RESPONSE_BODY_LIMIT } from '@cio/utils/constants/webhook';

import { resolveWebhookTarget, type TWebhookUrlPolicy } from './url-guard';

export type TWebhookSendInput = {
  url: URL;
  body: string;
  headers: Record<string, string>;
  verifySsl: boolean;
  policy: TWebhookUrlPolicy;
};

export type TWebhookSendResult = {
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  durationMs: number;
};

/**
 * POSTs the body to the vetted address of the URL's host. Never follows redirects and never throws:
 * transport, TLS, DNS, and timeout failures come back as `errorMessage`.
 */
export async function sendWebhookRequest(input: TWebhookSendInput): Promise<TWebhookSendResult> {
  const startedAt = Date.now();
  const failure = (errorMessage: string): TWebhookSendResult => ({
    responseStatus: null,
    responseBody: null,
    errorMessage,
    durationMs: Date.now() - startedAt
  });

  let target: Awaited<ReturnType<typeof resolveWebhookTarget>>;

  try {
    target = await resolveWebhookTarget(input.url, input.policy);
  } catch (error) {
    return failure(error instanceof Error ? error.message : 'Failed to resolve payload URL');
  }

  const transport = input.url.protocol === 'https:' ? https : http;

  return new Promise<TWebhookSendResult>((resolve) => {
    const request = transport.request(
      {
        protocol: input.url.protocol,
        host: input.url.hostname.replace(/^\[|\]$/g, ''),
        port: input.url.port || undefined,
        path: `${input.url.pathname}${input.url.search}`,
        method: 'POST',
        headers: { ...input.headers, 'Content-Length': Buffer.byteLength(input.body).toString() },
        timeout: WEBHOOK_REQUEST_TIMEOUT_MS,
        servername: input.url.hostname,
        rejectUnauthorized: input.verifySsl,
        lookup: (_hostname, _options, callback) => callback(null, target.address, target.family)
      } as https.RequestOptions,
      (response) => {
        const chunks: Buffer[] = [];
        let received = 0;

        response.on('data', (chunk: Buffer) => {
          received += chunk.length;

          if (received <= WEBHOOK_RESPONSE_BODY_LIMIT * 4) chunks.push(chunk);
        });
        response.on('end', () =>
          resolve({
            responseStatus: response.statusCode ?? null,
            responseBody: Buffer.concat(chunks).toString('utf8'),
            errorMessage: null,
            durationMs: Date.now() - startedAt
          })
        );
        response.on('error', (error) => resolve(failure(error.message)));
      }
    );

    request.on('timeout', () => {
      request.destroy();
      resolve(failure(`Request timed out after ${WEBHOOK_REQUEST_TIMEOUT_MS / 1000} seconds`));
    });
    request.on('error', (error) => resolve(failure(error.message)));
    request.end(input.body);
  });
}
