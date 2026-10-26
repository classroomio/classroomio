import type { Context } from 'hono';
import type { AuthSession } from '@api/types/auth';
import type { TEventSource } from '@cio/core/services/posthog';

export function getEventSource(c: Context<AuthSession>): TEventSource {
  const automationKey = c.get('automationKey');

  if (automationKey) return automationKey.type === 'mcp' ? 'mcp' : 'public_api';

  return c.req.path.startsWith('/public-api/') ? 'public_api' : 'dashboard';
}
