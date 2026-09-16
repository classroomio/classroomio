import { createConfiguredPlugins } from '@cio/plugins';
import {
  getEventBus,
  resolveConfig,
  type EventHandler,
  type HookName,
  type PluginDefinition,
  type ResolvedConfig
} from '@cio/sdk';
import { registerCertificateTemplates } from '@cio/certificates';

let resolvedPluginConfig: ResolvedConfig | null = null;

/**
 * Loads the same first-party plugin list used by the dashboard and registers
 * the server-side capabilities needed by the API process.
 */
export function initializePluginRuntime(plugins: PluginDefinition[] = createConfiguredPlugins()): ResolvedConfig {
  if (resolvedPluginConfig) return resolvedPluginConfig;

  const config = resolveConfig({ plugins });
  registerCertificateTemplates(Object.values(config.certificateTemplates));

  const eventBus = getEventBus();

  for (const plugin of config.plugins) {
    for (const [eventName, handler] of Object.entries(plugin.on ?? {})) {
      eventBus.register(eventName as HookName, handler as EventHandler);
    }
  }

  resolvedPluginConfig = config;

  return config;
}
