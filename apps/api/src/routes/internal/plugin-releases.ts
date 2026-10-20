import crypto from 'node:crypto';
import { zValidator } from '@hono/zod-validator';
import { Hono } from '@api/utils/hono';
import { AppError, handleError } from '@api/utils/errors';
import { ZInternalPluginReleaseRequest } from '@cio/utils/validation/plugin';
import { registerInternalReleases } from '@api/services/plugin/release';

function secretsMatch(providedToken: string, expectedToken: string): boolean {
  const providedDigest = crypto.createHash('sha256').update(providedToken).digest();
  const expectedDigest = crypto.createHash('sha256').update(expectedToken).digest();

  return crypto.timingSafeEqual(providedDigest, expectedDigest);
}

export const internalPluginReleasesRouter = new Hono().post(
  '/',
  async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return handleError(c, new AppError('Bearer token required', 'UNAUTHORIZED', 401));
    }
    const token = authHeader.slice(7).trim();
    const expectedToken = process.env.PLUGIN_RELEASE_DEPLOY_TOKEN;
    if (!expectedToken) {
      return handleError(c, new AppError('Plugin release authentication is not configured', 'SERVER_ERROR', 503));
    }

    if (!secretsMatch(token, expectedToken)) {
      return handleError(c, new AppError('Invalid release deployment token', 'UNAUTHORIZED', 401));
    }

    await next();
  },
  zValidator('json', ZInternalPluginReleaseRequest),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const result = await registerInternalReleases(body);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      return handleError(c, error, 'Failed to register plugin releases');
    }
  }
);
