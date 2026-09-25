import type { SlotName, PluginDefinition, PluginComponentLoader } from './types';

export interface ResolveActiveSlotLoadersParams {
  slotName: SlotName;
  plugins?: PluginDefinition[];
  enabledCapabilities: Set<string> | ReadonlySet<string>;
}

/**
 * Pure resolver that determines active component loaders for a slot.
 * Always-on plugins load unconditionally. Capability-gated plugins
 * load only if their declared capabilityId is active in enabledCapabilities.
 */
export function resolveActiveSlotLoaders(params: ResolveActiveSlotLoadersParams): PluginComponentLoader[] {
  const loaders: PluginComponentLoader[] = [];

  for (const plugin of params.plugins ?? []) {
    const activation = plugin.activation ?? { kind: 'always' };

    if (activation.kind === 'org-capability') {
      if (!params.enabledCapabilities.has(activation.capabilityId)) {
        continue;
      }
    }

    const slotDef = plugin.slots?.[params.slotName];
    if (!slotDef) continue;

    if (Array.isArray(slotDef)) {
      loaders.push(...slotDef);
    } else {
      loaders.push(slotDef);
    }
  }

  return loaders;
}
