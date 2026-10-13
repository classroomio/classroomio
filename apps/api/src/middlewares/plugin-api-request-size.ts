import type { MiddlewareHandler } from 'hono';
import type { AuthSession } from '@api/types/auth';
import { AppError } from '@api/utils/errors';
import { handlePluginApiError } from '@api/routes/plugin-api/errors';

export const PLUGIN_API_MAX_REQUEST_BYTES = 256 * 1024;

export const pluginApiRequestSizeMiddleware: MiddlewareHandler<AuthSession> = async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'HEAD' || c.req.method === 'DELETE') {
    await next();

    return;
  }

  const contentLength = Number(c.req.header('content-length') ?? 0);
  if (Number.isFinite(contentLength) && contentLength > PLUGIN_API_MAX_REQUEST_BYTES) {
    return handlePluginApiError(
      c,
      new AppError('Plugin API request exceeds 256 KiB', 'PAYLOAD_TOO_LARGE', 413),
      'Plugin API request is too large'
    );
  }

  const requestBody = await c.req.raw.clone().arrayBuffer();
  if (requestBody.byteLength > PLUGIN_API_MAX_REQUEST_BYTES) {
    return handlePluginApiError(
      c,
      new AppError('Plugin API request exceeds 256 KiB', 'PAYLOAD_TOO_LARGE', 413),
      'Plugin API request is too large'
    );
  }

  await next();
};
