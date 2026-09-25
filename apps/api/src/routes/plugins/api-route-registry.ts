import type { MiddlewareHandler } from 'hono';
import { configuredPlugins } from '@cio/plugins';
import { certificateStudioRouter } from './certificate-studio';

const configuredPluginIds = new Set(configuredPlugins.map((plugin) => plugin.id));

function createConfiguredPluginGuard(pluginId: string): MiddlewareHandler {
  return async (context, next) => {
    if (!configuredPluginIds.has(pluginId)) {
      return context.notFound();
    }

    return next();
  };
}

/**
 * API route contributions supplied by in-tree plugins.
 *
 * Hono routes remain statically composed so its RPC client retains exact route
 * types. The guard makes `configuredPlugins` the runtime authority: removing a
 * plugin from that array immediately makes its contributed endpoints unavailable.
 */
export const pluginApiRoutes = {
  certificateStudio: {
    pluginId: 'certificate_studio',
    mountPath: '/certificate-studio' as const,
    router: certificateStudioRouter,
    guard: createConfiguredPluginGuard('certificate_studio')
  }
} as const;
