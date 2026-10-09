import * as z from 'zod';
import { ZPluginPermissionScope, type PluginPermissionScope } from './scopes';

const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const REVERSE_DOMAIN_ID_REGEX = /^[a-z0-9_-]+(\.[a-z0-9_-]+)+$/i;

function isSafeRelativePath(path: string): boolean {
  if (path.startsWith('/') || path.startsWith('\\')) return false;
  const segments = path.split(/[/\\]/);
  return !segments.includes('..');
}

const ZSafeRelativePath = z.string().trim().min(1).refine(isSafeRelativePath, {
  message: 'Entrypoint path must be a relative path and must not contain directory traversal (..)'
});

export const STABLE_CONTRIBUTION_TARGETS = [
  'lms.banner',
  'course.sidebar',
  'course.actions',
  'lesson.after',
  'certificate.actions',
  'certificate.templates',
  'organization.navigation',
  'plugin.page'
] as const;
export type StableContributionTarget = (typeof STABLE_CONTRIBUTION_TARGETS)[number];

export const EXPERIMENTAL_CONTRIBUTION_TARGETS = [
  'lesson.activity',
  'lesson.sidebar',
  'course.format',
  'landing.sections',
  'landing.hero.after',
  'landing.footer.before',
  'enrollment.flow'
] as const;
export type ExperimentalContributionTarget = (typeof EXPERIMENTAL_CONTRIBUTION_TARGETS)[number];

export const ALL_ALLOWED_CONTRIBUTION_TARGETS = [
  ...STABLE_CONTRIBUTION_TARGETS,
  ...EXPERIMENTAL_CONTRIBUTION_TARGETS
] as const;
export type AllowedContributionTarget = (typeof ALL_ALLOWED_CONTRIBUTION_TARGETS)[number];

export const ZContributionTarget = z.enum(ALL_ALLOWED_CONTRIBUTION_TARGETS);

export const ZPluginNavigationContribution = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(64),
  page: z.string().trim().min(1).max(64),
  icon: z.string().trim().max(64).optional(),
  visibility: z.string().trim().max(64).optional()
});
export type TPluginNavigationContribution = z.infer<typeof ZPluginNavigationContribution>;

export const ZPluginPageContribution = z.object({
  id: z.string().trim().min(1).max(64),
  entrypoint: z.string().trim().min(1).max(64),
  title: z.string().trim().max(100).optional()
});
export type TPluginPageContribution = z.infer<typeof ZPluginPageContribution>;

export const ZPluginCommandContribution = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(100),
  icon: z.string().trim().max(64).optional(),
  category: z.string().trim().max(64).optional()
});
export type TPluginCommandContribution = z.infer<typeof ZPluginCommandContribution>;

export const ZPluginActionContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    target: ZContributionTarget,
    renderMode: z.enum(['host', 'custom']).default('host'),
    entrypoint: z.string().trim().min(1).max(64).optional(),
    label: z.string().trim().max(100).optional(),
    icon: z.string().trim().max(64).optional(),
    actionType: z.enum(['openUrl', 'command', 'dialog']).optional().default('command'),
    urlTemplate: z.string().trim().optional(),
    command: z.string().trim().max(128).optional()
  })
  .refine(
    (action) => {
      if (action.renderMode === 'custom' && !action.entrypoint) {
        return false;
      }
      return true;
    },
    { message: 'Custom action requires an entrypoint' }
  );
export type TPluginActionContribution = z.infer<typeof ZPluginActionContribution>;

export const ZPluginSlotContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    target: ZContributionTarget,
    renderMode: z.enum(['custom', 'host']).default('custom'),
    entrypoint: z.string().trim().min(1).max(64).optional(),
    title: z.string().trim().max(100).optional()
  })
  .refine(
    (slot) => {
      if (slot.renderMode === 'custom' && !slot.entrypoint) {
        return false;
      }
      return true;
    },
    { message: 'Custom slot requires an entrypoint' }
  );
export type TPluginSlotContribution = z.infer<typeof ZPluginSlotContribution>;

export const ZPluginContributions = z.object({
  navigation: z.array(ZPluginNavigationContribution).optional().default([]),
  pages: z.array(ZPluginPageContribution).optional().default([]),
  actions: z.array(ZPluginActionContribution).optional().default([]),
  commands: z.array(ZPluginCommandContribution).optional().default([]),
  slots: z.array(ZPluginSlotContribution).optional().default([])
});
export type TPluginContributions = z.infer<typeof ZPluginContributions>;

export const ZPluginRuntimeUiEntrypointObject = z.object({
  renderMode: z.literal('custom').default('custom'),
  resource: ZSafeRelativePath
});
export type TPluginRuntimeUiEntrypointObject = z.infer<typeof ZPluginRuntimeUiEntrypointObject>;

export const ZPluginRuntimeUiEntrypoint = z.union([ZSafeRelativePath, ZPluginRuntimeUiEntrypointObject]);
export type TPluginRuntimeUiEntrypoint = z.infer<typeof ZPluginRuntimeUiEntrypoint>;

export function resolveEntrypointResource(entrypoint: TPluginRuntimeUiEntrypoint | undefined): string | undefined {
  if (!entrypoint) return undefined;
  if (typeof entrypoint === 'string') return entrypoint;
  return entrypoint.resource;
}

export const ZPluginRuntimeUi = z.object({
  entrypoints: z.record(z.string(), ZPluginRuntimeUiEntrypoint)
});
export type TPluginRuntimeUi = z.infer<typeof ZPluginRuntimeUi>;

export const ZPluginRuntimeBackend = z.object({
  type: z.literal('remote'),
  baseUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith('https://') || url.startsWith('http://localhost'), {
      message: 'Backend baseUrl must use HTTPS (or http://localhost for local testing)'
    }),
  webhookPath: z
    .string()
    .trim()
    .refine((path) => path.startsWith('/'), { message: 'webhookPath must start with /' })
    .optional()
});
export type TPluginRuntimeBackend = z.infer<typeof ZPluginRuntimeBackend>;

export const ZPluginRuntime = z.object({
  ui: ZPluginRuntimeUi.optional(),
  backend: ZPluginRuntimeBackend.optional()
});
export type TPluginRuntime = z.infer<typeof ZPluginRuntime>;

export const ZPluginEngines = z.object({
  classroomio: z.string().trim().min(1),
  pluginApi: z.string().trim().min(1)
});
export type TPluginEngines = z.infer<typeof ZPluginEngines>;

export const ZPluginPermissions = z.object({
  required: z.array(ZPluginPermissionScope).default([]),
  optional: z.array(ZPluginPermissionScope).optional().default([])
});
export type TPluginPermissions = z.infer<typeof ZPluginPermissions>;

export const ZPluginNetworkAccess = z.object({
  allowedDomains: z
    .array(
      z
        .string()
        .url()
        .refine((url) => url.startsWith('https://') || url.startsWith('http://localhost'), {
          message: 'Allowed domain must be a valid HTTPS URL origin (or http://localhost for local dev)'
        })
    )
    .default([])
});
export type TPluginNetworkAccess = z.infer<typeof ZPluginNetworkAccess>;

export const ZPluginEvents = z.object({
  subscriptions: z.array(z.string().trim().min(1).max(128)).optional().default([])
});
export type TPluginEvents = z.infer<typeof ZPluginEvents>;

export const ZPluginDataPolicy = z.object({
  storesCustomerData: z.boolean(),
  retentionAfterUninstallDays: z.number().int().min(0).max(90).default(30),
  privacyPolicyUrl: z.string().url().optional()
});
export type TPluginDataPolicy = z.infer<typeof ZPluginDataPolicy>;

export const ZPluginManifest = z
  .object({
    $schema: z.string().url().optional(),
    manifestVersion: z.literal(1),
    id: z.string().trim().min(3).max(128).regex(REVERSE_DOMAIN_ID_REGEX, {
      message: 'Plugin ID must be in reverse-domain format (e.g. "com.classroomio.certificate-studio")'
    }),
    name: z.string().trim().min(2).max(64),
    version: z.string().trim().regex(SEMVER_REGEX, {
      message: 'Plugin version must follow SemVer 2.0 (e.g. "1.0.0")'
    }),
    description: z.string().trim().min(5).max(500),
    publisher: z.string().trim().min(2).max(64),
    license: z.string().trim().max(64).optional(),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    engines: ZPluginEngines,
    runtime: ZPluginRuntime.optional(),
    permissions: ZPluginPermissions.default({ required: [], optional: [] }),
    networkAccess: ZPluginNetworkAccess.optional().default({ allowedDomains: [] }),
    events: ZPluginEvents.optional().default({ subscriptions: [] }),
    contributes: ZPluginContributions.optional().default({
      navigation: [],
      pages: [],
      actions: [],
      commands: [],
      slots: []
    }),
    settings: z
      .object({
        schema: z.record(z.string(), z.unknown()).optional()
      })
      .optional(),
    dataPolicy: ZPluginDataPolicy,
    extensions: z.record(z.string(), z.unknown()).optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    // 1. If storesCustomerData is true, privacyPolicyUrl is required
    if (data.dataPolicy.storesCustomerData && !data.dataPolicy.privacyPolicyUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'privacyPolicyUrl is required when storesCustomerData is true',
        path: ['dataPolicy', 'privacyPolicyUrl']
      });
    }

    // 2. Validate entrypoint references in contributes match declared ui.entrypoints
    const declaredEntrypoints = data.runtime?.ui?.entrypoints ?? {};

    for (const [idx, page] of data.contributes.pages.entries()) {
      if (!declaredEntrypoints[page.entrypoint]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Page "${page.id}" references undeclared ui.entrypoint "${page.entrypoint}"`,
          path: ['contributes', 'pages', idx, 'entrypoint']
        });
      }
    }

    for (const [idx, action] of data.contributes.actions.entries()) {
      if (
        (action.renderMode === 'custom' || action.entrypoint) &&
        (!action.entrypoint || !declaredEntrypoints[action.entrypoint])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Action "${action.id}" references undeclared ui.entrypoint "${action.entrypoint}"`,
          path: ['contributes', 'actions', idx, 'entrypoint']
        });
      }
    }

    for (const [idx, slot] of data.contributes.slots.entries()) {
      if (
        (slot.renderMode === 'custom' || slot.entrypoint) &&
        (!slot.entrypoint || !declaredEntrypoints[slot.entrypoint])
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Slot "${slot.id}" references undeclared ui.entrypoint "${slot.entrypoint}"`,
          path: ['contributes', 'slots', idx, 'entrypoint']
        });
      }
    }

    // 3. Forbid manifest assertions of platform privilege
    const FORBIDDEN_PRIVILEGED_KEYS = ['firstParty', 'official', 'trusted', 'builtin'] as const;
    const rawRecord = data as Record<string, unknown>;
    for (const key of FORBIDDEN_PRIVILEGED_KEYS) {
      if (key in rawRecord && rawRecord[key] !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Manifest cannot assert platform privilege field "${key}". Publisher class is managed exclusively by the registry.`,
          path: [key]
        });
      }
    }
  });

export type TPluginManifest = z.infer<typeof ZPluginManifest>;
