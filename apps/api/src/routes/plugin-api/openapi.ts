import { describeRoute } from 'hono-openapi';
import type { PluginPermissionScope } from '@cio/utils/validation/plugin';

export function describePluginApiRoute(options: {
  operationId: string;
  summary: string;
  scope: PluginPermissionScope;
}) {
  return describeRoute({
    operationId: options.operationId,
    summary: options.summary,
    description: `Requires the \`${options.scope}\` plugin permission scope.`,
    tags: ['Plugin API v1'],
    security: [{ pluginBearer: [] }],
    responses: {
      200: { description: 'Operation completed successfully' },
      400: { description: 'Invalid request' },
      401: { description: 'Invalid or expired plugin access token' },
      403: { description: 'Permission, actor, surface, or resource authorization denied' },
      404: { description: 'Resource not found' },
      429: { description: 'Plugin API rate limit exceeded' }
    }
  });
}
