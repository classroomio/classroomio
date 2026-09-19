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

/** Merges plugin route maps, last-write-wins on key collisions. */
function aggregateRoutes(plugins: PluginDefinition[]): Record<string, any> {
  const routes: Record<string, any> = {};

  for (const plugin of plugins) {
    if (plugin.routes) {
      Object.assign(routes, plugin.routes);
    }
  }

  return routes;
}

/** Merges plugin entities into a dictionary, rejecting name collisions. */
function aggregateEntities(
  plugins: PluginDefinition[],
  topLevelEntities: ClassroomIOConfig['entities'] = []
): Record<string, any> {
  const entities: Record<string, any> = {};

  for (const entity of topLevelEntities ?? []) {
    entities[entity.name] = entity;
  }

  for (const plugin of plugins) {
    if (!plugin.entities) continue;

    for (const entity of plugin.entities) {
      if (entities[entity.name]) {
        throw new Error(`Entity name collision: entity "${entity.name}" is declared multiple times across plugins.`);
      }
      entities[entity.name] = entity;
    }
  }

  return entities;
}

/** Merges plugin activities into a dictionary, rejecting key collisions. */
function aggregateActivities(
  plugins: PluginDefinition[],
  topLevelActivities: ClassroomIOConfig['activities'] = []
): Record<string, any> {
  const activities: Record<string, any> = {};

  for (const act of topLevelActivities ?? []) {
    activities[act.key] = act;
  }

  for (const plugin of plugins) {
    if (!plugin.activities) continue;

    for (const act of plugin.activities) {
      if (activities[act.key]) {
        throw new Error(`Activity key collision: activity "${act.key}" is declared multiple times across plugins.`);
      }
      activities[act.key] = act;
    }
  }

  return activities;
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
 * and aggregating plugin registrations (nav, routes, slots, entities, activities).
 *
 * Also enforces structural constraints (C-10: privacy required for data-storing plugins).
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

  // C-10: any plugin that declares entities must also declare a privacy manifest.
  for (const plugin of plugins) {
    if (plugin.entities && plugin.entities.length > 0 && !plugin.privacy) {
      throw new Error(
        `[ClassroomIO SDK] Plugin "${plugin.id}" declares entities but has no privacy manifest. ` +
          `Add a privacy block with onDeleteUser and onExportUser to comply with C-10 (GDPR requirement).`
      );
    }
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
    routes: aggregateRoutes(plugins),
    slots: aggregateSlots(plugins),
    entities: aggregateEntities(plugins, config.entities),
    activities: aggregateActivities(plugins, config.activities),
    certificateTemplates: aggregateCertificateTemplates(plugins)
  };
}
