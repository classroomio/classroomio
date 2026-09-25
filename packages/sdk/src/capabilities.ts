import type { PluginCategory, PluginDefinition } from './types';

export interface PluginCapabilityDefinition {
  id: string;
  pluginId: string;
  category: PluginCategory;
  nameKey: string;
  descriptionKey: string;
  icon?: string;
  managePath?: string;
  manageLabelKey?: string;
}

export interface OrgCapabilitySummary {
  id: string;
  pluginId: string;
  category: PluginCategory;
  nameKey: string;
  descriptionKey: string;
  icon?: string;
  managePath?: string;
  manageLabelKey?: string;
  isEnabled: boolean;
  updatedAt: string | null;
}

export function resolvePluginCapabilities(plugins: PluginDefinition[]): PluginCapabilityDefinition[] {
  const capabilities: PluginCapabilityDefinition[] = [];
  const capabilityIds = new Set<string>();

  for (const plugin of plugins) {
    if (plugin.activation?.kind !== 'org-capability') continue;

    const { capabilityId, nameKey, descriptionKey } = plugin.activation;

    if (capabilityIds.has(capabilityId)) {
      throw new Error(`[ClassroomIO SDK] Capability id "${capabilityId}" is registered more than once.`);
    }

    capabilityIds.add(capabilityId);
    capabilities.push({
      id: capabilityId,
      pluginId: plugin.id,
      category: plugin.category,
      nameKey,
      descriptionKey,
      icon: plugin.pluginNav?.icon,
      managePath: plugin.pluginNav ? `/plugins/${plugin.pluginNav.path}` : undefined,
      manageLabelKey: plugin.pluginNav?.manageLabelKey
    });
  }

  return capabilities;
}

export function findConfiguredCapability(
  plugins: PluginDefinition[],
  capabilityId: string
): PluginCapabilityDefinition | undefined {
  return resolvePluginCapabilities(plugins).find((capability) => capability.id === capabilityId);
}
