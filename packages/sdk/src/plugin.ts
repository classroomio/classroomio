import { z } from 'zod';
import { isDefinedActivityType } from './activity';
import { isDefinedCertificateTemplate } from './certificate';
import { isDefinedEntity } from './entity';
import {
  HOOK_NAMES,
  PERMISSION_SCOPES,
  PLUGIN_CATEGORIES,
  SLOT_NAMES,
  type PluginComponentLoader,
  type PluginDefinition
} from './types';

const pluginIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const definedPlugins = new WeakSet<object>();

const componentLoaderSchema = z.custom<PluginComponentLoader>((value: unknown) => typeof value === 'function', {
  message: 'Plugin UI registrations must be dynamic import loader functions.'
});

const pluginSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1),
    version: z.string().regex(semverPattern, 'Plugin version must be valid semver.'),
    category: z.enum(PLUGIN_CATEGORIES),
    description: z.string().trim().min(1),
    permissions: z.array(z.enum(PERMISSION_SCOPES)).optional(),
    nav: z
      .object({
        add: z.array(z.custom<NonNullable<NonNullable<PluginDefinition['nav']>['add']>[number]>()).optional()
      })
      .optional(),
    routes: z.record(z.string(), z.unknown()).optional(),
    slots: z.record(z.string(), z.union([componentLoaderSchema, z.array(componentLoaderSchema).min(1)])).optional(),
    on: z
      .record(
        z.string(),
        z.custom((value: unknown) => typeof value === 'function')
      )
      .optional(),
    entities: z
      .array(
        z.custom(isDefinedEntity, {
          message: 'Plugin entities must be created with defineEntity().'
        })
      )
      .optional(),
    activities: z
      .array(
        z.custom(isDefinedActivityType, {
          message: 'Plugin activities must be created with defineActivityType().'
        })
      )
      .optional(),
    certificateTemplates: z
      .array(
        z.custom(isDefinedCertificateTemplate, {
          message: 'Plugin certificate templates must be created with defineCertificateTemplate().'
        })
      )
      .optional(),
    privacy: z
      .object({
        description: z.string().trim().min(1),
        storesPersonalData: z.boolean(),
        onDeleteUser: z.custom((value: unknown) => typeof value === 'function'),
        onExportUser: z.custom((value: unknown) => typeof value === 'function')
      })
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

  for (const hookName of Object.keys(result.data.on ?? {})) {
    if (!HOOK_NAMES.includes(hookName as (typeof HOOK_NAMES)[number])) {
      throw new Error(`[ClassroomIO SDK] Unknown plugin hook "${hookName}" in plugin "${result.data.id}".`);
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
