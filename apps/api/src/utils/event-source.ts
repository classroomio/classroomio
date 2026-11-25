import type { Context } from 'hono';
import type { AuthSession } from '@api/types/auth';
import type { TCreatedVia } from '@cio/utils/constants/created-via';

export function getEventSource(c: Context<AuthSession>): Extract<TCreatedVia, 'dashboard' | 'public_api' | 'mcp'> {
  const automationKey = c.get('automationKey');

  if (automationKey) return automationKey.type === 'mcp' ? 'mcp' : 'public_api';

  return c.req.path.startsWith('/public-api/') ? 'public_api' : 'dashboard';
}
