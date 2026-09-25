import { sidebar } from './layouts';
import { isDefinedPlugin } from './plugin';
import type {
  CertificateTemplateDefinition,
  ClassroomIOConfig,
  PluginComponentLoader,
  PluginDefinition,
  ResolvedConfig,
  SlotName
} from './types';

const DEFAULT_THEME = {
  primary: '#0F62FE',
  radius: 'md',
  font: 'Inter'
};

/**
 * Type helper to define a ClassroomIO configuration object with autocompletion.
 * Call this in `classroomio.config.ts` at the repo root.
 */
export function defineConfig(config: ClassroomIOConfig): ClassroomIOConfig {
  return config;
}

// ---------------------------------------------------------------------------
// Plugin aggregation helpers
// ---------------------------------------------------------------------------

/** Merges plugin nav additions into the accumulated add-list. */
function aggregateNav(plugins: PluginDefinition[]): ClassroomIOConfig['nav'] {
  const add: NonNullable<ClassroomIOConfig['nav']>['add'] = [];

  for (const plugin of plugins) {
    if (plugin.nav?.add) {
      add.push(...plugin.nav.add);
    }
  }

  return { add };
}

/** Merges plugin slot registrations, coercing single components to arrays. */
function aggregateSlots(plugins: PluginDefinition[]): Partial<Record<SlotName, PluginComponentLoader[]>> {
  const slots: Partial<Record<SlotName, PluginComponentLoader[]>> = {};

  for (const plugin of plugins) {
    if (!plugin.slots) continue;

    for (const [rawSlotName, componentOrList] of Object.entries(plugin.slots)) {
      const slotName = rawSlotName as SlotName;

      if (!slots[slotName]) {
        slots[slotName] = [];
      }

      if (Array.isArray(componentOrList)) {
        slots[slotName].push(...componentOrList);
      } else {
        slots[slotName].push(componentOrList);
      }
    }
  }

  return slots;
}

/** Merges declarative certificate templates, rejecting plugin collisions. */
function aggregateCertificateTemplates(plugins: PluginDefinition[]): Record<string, CertificateTemplateDefinition> {
  const templates: Record<string, CertificateTemplateDefinition> = {};

  for (const plugin of plugins) {
    for (const template of plugin.certificateTemplates ?? []) {
      if (templates[template.id]) {
        throw new Error(
          `Certificate template id collision: template "${template.id}" is declared multiple times across plugins.`
        );
      }

      templates[template.id] = template;
    }
  }

  return templates;
}

// ---------------------------------------------------------------------------
// Public resolver
// ---------------------------------------------------------------------------

/**
 * Resolves a ClassroomIO configuration object by merging with system defaults
 * and aggregating plugin registrations (navigation, slots, and certificate templates).
 */
export function resolveConfig(config: ClassroomIOConfig = {}): ResolvedConfig {
  const plugins = config.plugins ?? [];
  const pluginIds = new Set<string>();

  for (const plugin of plugins) {
    if (!isDefinedPlugin(plugin)) {
      throw new Error('[ClassroomIO SDK] Every plugin must be registered with definePlugin().');
    }

    if (pluginIds.has(plugin.id)) {
      throw new Error(`[ClassroomIO SDK] Plugin id "${plugin.id}" is registered more than once.`);
    }

    pluginIds.add(plugin.id);
  }

  const pluginNav = aggregateNav(plugins);

  return {
    theme: { ...DEFAULT_THEME, ...(config.theme ?? {}) },
    layout: config.layout ?? sidebar(),
    nav: {
      remove: [...(config.nav?.remove ?? [])],
      rename: { ...(config.nav?.rename ?? {}) },
      add: [...(config.nav?.add ?? []), ...(pluginNav?.add ?? [])]
    },
    terminology: { ...(config.terminology ?? {}) },
    plugins,
    slots: aggregateSlots(plugins),
    certificateTemplates: aggregateCertificateTemplates(plugins)
  };
}
