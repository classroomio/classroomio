import type { Context, Next } from 'hono';

import type { AuthSession } from '@api/types/auth';
import { MCP_V1_ROUTE_TOOL_MAP } from '@api/middlewares/v1-mcp-usage';
import { recordAutomationChange } from '@api/services/organization/automation-change';
import { getMcpAutomationCategory } from '@cio/utils/plans';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type TRouteMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function isSuccess(status: number) {
  return status >= 200 && status < 300;
}

function toId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number') return String(value);

  return null;
}

/**
 * Id of the resource a create returned: `data.id`, else the id of the first object inside `data` that has one.
 * @returns null when the response is not JSON or carries no id.
 */
async function readCreatedId(response: Response): Promise<string | null> {
  if (!response.headers.get('content-type')?.includes('application/json')) return null;

  const body = await response
    .clone()
    .json()
    .catch(() => null);
  const data = body?.data;
  if (!data || typeof data !== 'object') return null;

  const ownId = toId(data.id);
  if (ownId) return ownId;

  const nested = Object.values(data).find(
    (value) => value && typeof value === 'object' && !Array.isArray(value) && toId((value as { id?: unknown }).id)
  ) as { id?: unknown } | undefined;

  return nested ? toId(nested.id) : null;
}

/**
 * Records every successful write made with an API key or OAuth token (public API and MCP) in
 * `automation_change_log`. Reads, failed requests and session (dashboard) requests are not recorded, and a
 * failure to record never changes the response.
 */
export async function automationChangeLogMiddleware(c: Context<AuthSession>, next: Next) {
  await next();

  const automationKey = c.get('automationKey');
  const method = c.req.method;
  if (!automationKey || !WRITE_METHODS.has(method) || !isSuccess(c.res.status)) return;

  const route = c.req.routePath;
  const toolName = MCP_V1_ROUTE_TOOL_MAP[route]?.[method as TRouteMethod];
  if (toolName && getMcpAutomationCategory(toolName) === 'read') return;

  try {
    const createdId = method === 'POST' ? await readCreatedId(c.res) : null;
    const resourceIds = { ...c.req.param(), ...(createdId ? { createdId } : {}) };

    await recordAutomationChange({
      automationKey,
      oauthClientId: c.get('oauthClientId'),
      clientName: c.get('clientName') ?? null,
      actorProfileId: c.get('actorId') ?? null,
      method,
      route,
      action: c.get('automationAction') ?? toolName ?? `${method} ${route}`,
      resourceIds,
      statusCode: c.res.status
    });
  } catch (error) {
    console.error('automationChangeLogMiddleware: failed to record automation change', error);
  }
}
