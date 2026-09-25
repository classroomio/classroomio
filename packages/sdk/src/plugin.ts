import { z } from 'zod';
import { isDefinedCertificateTemplate } from './certificate';
import { PLUGIN_CATEGORIES, SLOT_NAMES, type PluginComponentLoader, type PluginDefinition } from './types';

const pluginIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const definedPlugins = new WeakSet<object>();

const componentLoaderSchema = z.custom<PluginComponentLoader>((value: unknown) => typeof value === 'function', {
  message: 'Plugin UI registrations must be dynamic import loader functions.'
});

const pluginActivationSchema = z.union([
  z.object({
    kind: z.literal('always')
  }),
  z.object({
    kind: z.literal('org-capability'),
    capabilityId: z.string().trim().min(1),
    nameKey: z.string().trim().min(1),
    descriptionKey: z.string().trim().min(1)
  })
]);

const pluginSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    version: z.string().regex(semverPattern, 'Plugin version must be valid semver.'),
    category: z.enum(PLUGIN_CATEGORIES),
    description: z.string().trim().min(1),
    activation: pluginActivationSchema.optional(),
    pluginNav: z
      .object({
        titleKey: z.string().trim().min(1, 'pluginNav.titleKey must be a non-empty string.'),
        path: z
          .string()
          .trim()
          .min(1, 'pluginNav.path must be a non-empty string.')
          .regex(/^[a-z0-9-]+$/, 'pluginNav.path must be lowercase alphanumeric with hyphens only.'),
        icon: z.string().trim().min(1, 'pluginNav.icon must be a non-empty icon name string.'),
        manageLabelKey: z.string().trim().min(1).optional(),
        group: z.enum(['main', 'tools', 'bottom']).optional(),
        adminOnly: z.boolean().optional()
      })
      .optional(),
    nav: z
      .object({
        remove: z.array(z.string()).optional(),
        rename: z.record(z.string(), z.string()).optional(),
        add: z
          .array(
            z.object({
              key: z.string().trim().min(1),
              title: z.string().trim().min(1),
              path: z.string().trim().min(1),
              group: z.string().nullable().optional(),
              icon: z.any().optional()
            })
          )
          .optional()
      })
      .optional(),
    routes: z.record(z.string(), componentLoaderSchema).optional(),
    slots: z.record(z.string(), z.union([componentLoaderSchema, z.array(componentLoaderSchema).min(1)])).optional(),
    certificateTemplates: z
      .array(
        z.custom(isDefinedCertificateTemplate, {
          message: 'Plugin certificate templates must be created with defineCertificateTemplate().'
        })
      )
      .optional()
  })
  .strict();

function formatValidationError(error: z.ZodError): string {
  const issue = error.issues[0];
  const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';

  return `${issue.message}${path}`;
}

/**
 * Defines and validates a ClassroomIO plugin manifest at module import time.
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition {
  const result = pluginSchema.safeParse(definition);

  if (!result.success) {
    throw new Error(`[ClassroomIO SDK] Invalid plugin manifest: ${formatValidationError(result.error)}`);
  }

  if (!pluginIdPattern.test(result.data.id)) {
    throw new Error(
      `[ClassroomIO SDK] Invalid plugin id "${result.data.id}". ` +
        'Must match {category}_{slug} using lowercase letters, numbers, and single underscores.'
    );
  }

  const expectedPrefix = `${result.data.category}_`;

  if (!result.data.id.startsWith(expectedPrefix)) {
    throw new Error(
      `[ClassroomIO SDK] Plugin id "${result.data.id}" does not match its declared category ` +
        `"${result.data.category}". The id must start with "${expectedPrefix}".`
    );
  }

  for (const slotName of Object.keys(result.data.slots ?? {})) {
    if (!SLOT_NAMES.includes(slotName as (typeof SLOT_NAMES)[number])) {
      throw new Error(`[ClassroomIO SDK] Unknown plugin slot "${slotName}" in plugin "${result.data.id}".`);
    }
  }

  const plugin = result.data as PluginDefinition;
  definedPlugins.add(plugin);

  return plugin;
}

/** @internal Used by resolveConfig to prevent raw manifests from bypassing definePlugin(). */
export function isDefinedPlugin(definition: unknown): definition is PluginDefinition {
  return typeof definition === 'object' && definition !== null && definedPlugins.has(definition);
}
