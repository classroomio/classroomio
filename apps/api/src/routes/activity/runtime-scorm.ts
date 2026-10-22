import { ZRuntimeTokenParam, ZScormCommit, ZScormRuntimeEvent } from '@cio/utils/validation/activity/scorm';
import {
  commitScormAttempt,
  getScormRuntimeState,
  reportScormRuntimeEvent
} from '@api/services/activity/runtime-scorm';

import type { Context, Next } from 'hono';
import { Hono } from '@api/utils/hono';
import { activityRuntimeRateLimiter } from '@api/middlewares/rate-limiter';
import { AppError, ErrorCodes, handleError } from '@api/utils/errors';
import { zValidator } from '@hono/zod-validator';
import { verifyLaunchToken } from '@cio/activity-packages';
import { getActivitySigningSecret } from '@cio/core/config/activity-content';

const RUNTIME_BODY_MAX_BYTES = 524288;

async function verifyRuntimeLaunchToken(c: Context, next: Next) {
  const launchToken = c.req.param('launchToken');
  if (!launchToken) {
    return c.json({ success: false, error: 'Launch token is required', code: ErrorCodes.UNAUTHORIZED }, 401);
  }
  const secret = getActivitySigningSecret();
  if (!secret) {
    return c.json({ success: false, error: 'Activity run-time not configured', code: ErrorCodes.INTERNAL_ERROR }, 503);
  }

  try {
    const claims = await verifyLaunchToken(launchToken, secret, Date.now());
    c.set('runtimeClaims', claims);
    await next();
  } catch {
    return c.json({ success: false, error: 'Invalid launch token', code: ErrorCodes.UNAUTHORIZED }, 401);
  }
}

async function readBoundedText(c: Context, maxBytes: number, errorMessage: string): Promise<string> {
  const bodyStream = c.req.raw.body;
  if (!bodyStream) {
    const text = await c.req.text();
    if (new TextEncoder().encode(text).length > maxBytes) {
      throw new AppError(errorMessage, ErrorCodes.VALIDATION_ERROR, 413);
    }

    return text;
  }

  const reader = bodyStream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        totalBytes += value.byteLength;
        if (totalBytes > maxBytes) {
          await reader.cancel();
          throw new AppError(errorMessage, ErrorCodes.VALIDATION_ERROR, 413);
        }

        chunks.push(value);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(combined);
}

function rejectOversizedBody(c: Context, errorMessage: string): Response | null {
  const declared = c.req.header('content-length');
  if (declared && Number(declared) > RUNTIME_BODY_MAX_BYTES) {
    return c.json({ success: false, error: errorMessage, code: ErrorCodes.VALIDATION_ERROR }, 413);
  }

  return null;
}

function truncateUserAgent(value: string | null): string | null {
  if (!value) return value;

  return value.length > 512 ? value.slice(0, 512) : value;
}

export const runtimeScormRouter = new Hono()
  .get(
    '/:launchToken/state',
    zValidator('param', ZRuntimeTokenParam),
    verifyRuntimeLaunchToken,
    activityRuntimeRateLimiter,
    async (c) => {
      try {
        const { launchToken } = c.req.valid('param');
        const result = await getScormRuntimeState(launchToken, truncateUserAgent(c.req.header('user-agent') ?? null));

        return c.json(result, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to load launch state');
      }
    }
  )
  .post(
    '/:launchToken/commit',
    zValidator('param', ZRuntimeTokenParam),
    verifyRuntimeLaunchToken,
    activityRuntimeRateLimiter,
    async (c) => {
      try {
        const { launchToken } = c.req.valid('param');
        const oversized = rejectOversizedBody(c, 'Commit payload too large');
        if (oversized) return oversized;

        const text = await readBoundedText(c, RUNTIME_BODY_MAX_BYTES, 'Commit payload too large');
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
        const parsed = ZScormCommit.safeParse(body);
        if (!parsed.success) throw new AppError('Invalid commit payload', ErrorCodes.VALIDATION_ERROR, 400);
        const contentType = c.req.header('content-type') ?? '';
        const viaBeacon = contentType.includes('text/plain');
        const result = await commitScormAttempt(
          launchToken,
          parsed.data,
          viaBeacon,
          truncateUserAgent(c.req.header('user-agent') ?? null)
        );

        if (result.rejected) {
          return c.json(
            {
              result: false,
              errorCode: 101,
              completedActivity: false,
              progressChanged: false
            },
            200
          );
        }

        return c.json(
          {
            result: true,
            errorCode: 0,
            completedActivity: result.completedActivity,
            progressChanged: result.progressChanged
          },
          200
        );
      } catch (error) {
        return handleError(c, error, 'Failed to save commit');
      }
    }
  )
  .post(
    '/:launchToken/event',
    zValidator('param', ZRuntimeTokenParam),
    verifyRuntimeLaunchToken,
    activityRuntimeRateLimiter,
    async (c) => {
      try {
        const { launchToken } = c.req.valid('param');
        const oversized = rejectOversizedBody(c, 'Event payload too large');
        if (oversized) return oversized;

        const text = await readBoundedText(c, RUNTIME_BODY_MAX_BYTES, 'Event payload too large');
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
        const parsed = ZScormRuntimeEvent.safeParse(body);
        if (!parsed.success) throw new AppError('Invalid event payload', ErrorCodes.VALIDATION_ERROR, 400);
        const result = await reportScormRuntimeEvent(
          launchToken,
          parsed.data.kind,
          parsed.data.detail,
          truncateUserAgent(c.req.header('user-agent') ?? null)
        );

        return c.json({ result: true, errorCode: 0, recorded: result.recorded }, 200);
      } catch (error) {
        return handleError(c, error, 'Failed to record event');
      }
    }
  );
