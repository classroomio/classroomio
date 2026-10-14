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
    let settled = false;
    const settle = (result: TWebhookSendResult) => {
      if (settled) return;

      settled = true;
      clearTimeout(deadline);
      resolve(result);
    };

    const request = transport.request(
      {
        protocol: input.url.protocol,
        host: input.url.hostname.replace(/^\[|\]$/g, ''),
        port: input.url.port || undefined,
        path: `${input.url.pathname}${input.url.search}`,
        method: 'POST',
        headers: { ...input.headers, 'Content-Length': Buffer.byteLength(input.body).toString() },
        servername: input.url.hostname,
        rejectUnauthorized: input.verifySsl,
        lookup: (_hostname, _options, callback) => callback(null, target.address, target.family)
      } as https.RequestOptions,
      (response) => {
        const chunks: Buffer[] = [];
        const readLimit = WEBHOOK_RESPONSE_BODY_LIMIT * 4;
        let received = 0;

        const finish = () =>
          settle({
            responseStatus: response.statusCode ?? null,
            responseBody: Buffer.concat(chunks).toString('utf8'),
            errorMessage: null,
            durationMs: Date.now() - startedAt
          });

        response.on('data', (chunk: Buffer) => {
          received += chunk.length;
          chunks.push(chunk);

          if (received <= readLimit) return;

          response.destroy();
          finish();
        });
        response.on('end', finish);
        response.on('error', (error) => settle(failure(error.message)));
      }
    );

    const deadline = setTimeout(() => {
      request.destroy();
      settle(failure(`Request timed out after ${WEBHOOK_REQUEST_TIMEOUT_MS / 1000} seconds`));
    }, WEBHOOK_REQUEST_TIMEOUT_MS);

    request.on('error', (error) => settle(failure(error.message)));
    request.end(input.body);
  });
}
