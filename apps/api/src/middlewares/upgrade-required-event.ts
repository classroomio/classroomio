import type { Context, Next } from 'hono';

import type { AuthSession } from '@api/types/auth';
import { getEventSource } from '@api/utils/event-source';
import { captureServerEvent, isServerEventsEnabled } from '@cio/core/services/posthog';
import { ErrorCodes } from '@cio/utils/errors';

const UPGRADE_CODES = new Set<string>([ErrorCodes.UPGRADE_REQUIRED, ErrorCodes.PLAN_UPGRADE_REQUIRED]);
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/** Sends `upgrade_required` when a request is refused because the org's plan doesn't include it. */
export async function upgradeRequiredEvent(c: Context<AuthSession>, next: Next) {
  await next();

  if (!isServerEventsEnabled() || (c.res.status !== 402 && c.res.status !== 403)) return;
  if (!c.res.headers.get('content-type')?.includes('application/json')) return;

  const body = await c.res
    .clone()
    .json()
    .catch(() => null);
  if (!UPGRADE_CODES.has(body?.code)) return;

  captureServerEvent({
    event: 'upgrade_required',
    distinctId: c.get('actorId') ?? c.get('user')?.id,
    orgId: c.get('orgId') ?? c.req.header('cio-org-id'),
    properties: {
      endpoint: `${c.req.method} ${c.req.path.replace(UUID_PATTERN, ':id')}`,
      source: getEventSource(c)
    }
  });
}
