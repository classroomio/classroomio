import { configuredPlugins } from '@cio/plugins';
import { resolveConfig, type PluginDefinition, type ResolvedConfig } from '@cio/sdk';
import { registerCertificateTemplates } from '@cio/certificates';

let resolvedPluginConfig: ResolvedConfig | null = null;

/**
 * Loads the same first-party plugin list used by the dashboard and registers
 * the server-side capabilities needed by the API process.
 */
export function initializePluginRuntime(plugins: PluginDefinition[] = configuredPlugins): ResolvedConfig {
  if (resolvedPluginConfig) return resolvedPluginConfig;

  const config = resolveConfig({ plugins });
  registerCertificateTemplates(Object.values(config.certificateTemplates));

  resolvedPluginConfig = config;

  return config;
}
