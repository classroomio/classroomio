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

function isHttpsUrlTemplate(value: string): boolean {
  const interpolatedValue = value.replace(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g, 'placeholder');

  try {
    return new URL(interpolatedValue).protocol === 'https:';
  } catch {
    return false;
  }
}

function getUrlTemplateOrigin(value: string): string | null {
  const interpolatedValue = value.replace(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g, 'placeholder');

  try {
    return new URL(interpolatedValue).origin;
  } catch {
    return null;
  }
}

function isAllowedNetworkOrigin(value: string): boolean {
  try {
    const parsed = new URL(value);
    const isSecure = parsed.protocol === 'https:' || (parsed.protocol === 'http:' && parsed.hostname === 'localhost');

    return (
      isSecure &&
      parsed.origin === value.replace(/\/$/, '') &&
      parsed.pathname === '/' &&
      !parsed.search &&
      !parsed.hash &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

const ZSafeRelativePath = z.string().trim().min(1).refine(isSafeRelativePath, {
  message: 'Plugin asset path must be relative and must not contain directory traversal (..)'
});

const PLUGIN_ICON_FILE_REGEX = /\.(?:svg|png|jpe?g|webp)$/i;

export const ZPluginIcon = z
  .object({
    resource: ZSafeRelativePath.max(256).refine((resource) => PLUGIN_ICON_FILE_REGEX.test(resource), {
      message: 'Plugin icon must be an SVG, PNG, JPEG, or WebP asset'
    })
  })
  .strict();
export type TPluginIcon = z.infer<typeof ZPluginIcon>;

export const STABLE_CONTRIBUTION_TARGETS = [
  'lms.banner',
  'course.sidebar',
  'course.newsfeed.aside',
  'lesson.after',
  'certificate.actions',
  'certificate.templates',
  'landing.templates',
  'organization.navigation',
  'plugin.page'
] as const;
export type StableContributionTarget = (typeof STABLE_CONTRIBUTION_TARGETS)[number];

export const EXPERIMENTAL_CONTRIBUTION_TARGETS = [] as const;
export type ExperimentalContributionTarget = (typeof EXPERIMENTAL_CONTRIBUTION_TARGETS)[number];

export const ALL_ALLOWED_CONTRIBUTION_TARGETS = [...STABLE_CONTRIBUTION_TARGETS] as const;
export type AllowedContributionTarget = (typeof ALL_ALLOWED_CONTRIBUTION_TARGETS)[number];

export const ZContributionTarget = z.enum(ALL_ALLOWED_CONTRIBUTION_TARGETS);

export const ZPluginContributionVisibility = z.enum(['all', 'admin', 'tutor', 'learner']);
export const ZPluginPageMode = z.enum(['view', 'edit']);
const contributionPresentation = {
  order: z.number().int().min(-1000).max(1000).optional().default(0),
  visibility: ZPluginContributionVisibility.optional().default('all'),
  pageModes: z.array(ZPluginPageMode).min(1).max(2).optional().default(['view'])
};

export const PLUGIN_SURFACE_CONTRACTS = {
  'lms.banner': { version: 1, minHeight: 48, maxHeight: 320, mobile: true, resource: null },
  'course.sidebar': { version: 1, minHeight: 120, maxHeight: 1200, mobile: true, resource: 'course' },
  'course.newsfeed.aside': { version: 1, minHeight: 120, maxHeight: 1200, mobile: true, resource: 'course' },
  'lesson.after': { version: 1, minHeight: 80, maxHeight: 1600, mobile: true, resource: 'lesson' },
  'certificate.actions': { version: 1, minHeight: 0, maxHeight: 0, mobile: true, resource: 'certificate' },
  'certificate.templates': { version: 1, minHeight: 320, maxHeight: 1600, mobile: true, resource: 'course' },
  'landing.templates': { version: 1, minHeight: 320, maxHeight: 1600, mobile: true, resource: 'organization' },
  'organization.navigation': { version: 1, minHeight: 0, maxHeight: 0, mobile: true, resource: 'organization' },
  'plugin.page': { version: 1, minHeight: 480, maxHeight: 4000, mobile: true, resource: 'organization' }
} as const;

export const ZPluginNavigationContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    title: z.string().trim().min(1).max(100),
    location: z.literal('organization.navigation'),
    page: z.string().trim().min(1).max(64),
    icon: ZPluginIcon.optional(),
    ...contributionPresentation
  })
  .strict();
export type TPluginNavigationContribution = z.infer<typeof ZPluginNavigationContribution>;

export const ZPluginPageContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    entrypoint: z.string().trim().min(1).max(64),
    title: z.string().trim().max(100).optional(),
    ...contributionPresentation
  })
  .strict();
export type TPluginPageContribution = z.infer<typeof ZPluginPageContribution>;

export const ZPluginActionContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    target: z.literal('certificate.actions'),
    renderMode: z.literal('host').default('host'),
    label: z.string().trim().max(100).optional(),
    icon: ZPluginIcon.optional(),
    actionType: z.literal('openUrl').default('openUrl'),
    urlTemplate: z.string().trim().min(1).refine(isHttpsUrlTemplate, {
      message: 'Action URL templates must use a valid HTTPS URL'
    }),
    ...contributionPresentation
  })
  .strict();
export type TPluginActionContribution = z.infer<typeof ZPluginActionContribution>;

export const ZPluginDeclaredTemplate = z
  .object({
    id: z.string().trim().min(1).max(64),
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(280).optional(),
    thumbnail: ZSafeRelativePath.optional()
  })
  .strict();
export type TPluginDeclaredTemplate = z.infer<typeof ZPluginDeclaredTemplate>;

export const ZPluginSlotContribution = z
  .object({
    id: z.string().trim().min(1).max(64),
    target: z.enum([
      'lms.banner',
      'course.sidebar',
      'course.newsfeed.aside',
      'lesson.after',
      'certificate.templates',
      'landing.templates'
    ]),
    renderMode: z.literal('custom').default('custom'),
    entrypoint: z.string().trim().min(1).max(64).optional(),
    pickerEntrypoint: z.string().trim().min(1).max(64).optional(),
    publicRendererEntrypoint: z.string().trim().min(1).max(64).optional(),
    publicViewModelVersion: z.literal(1).optional(),
    title: z.string().trim().max(100).optional(),
    templates: z.array(ZPluginDeclaredTemplate).max(50).optional(),
    ...contributionPresentation
  })
  .strict()
  .refine(
    (slot) => {
      if (slot.target === 'landing.templates') {
        return true;
      }

      if (slot.renderMode === 'custom' && !slot.entrypoint) {
        return false;
      }
      return true;
    },
    { message: 'Custom slot requires an entrypoint' }
  )
  .superRefine((slot, ctx) => {
    if (slot.target !== 'landing.templates') {
      if (slot.pickerEntrypoint || slot.publicRendererEntrypoint || slot.publicViewModelVersion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Landing template fields are only supported by landing.templates',
          path: ['target']
        });
      }
      return;
    }

    if (slot.renderMode !== 'custom') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates requires a custom picker',
        path: ['renderMode']
      });
    }

    if (slot.entrypoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates must declare pickerEntrypoint instead of entrypoint',
        path: ['entrypoint']
      });
    }

    if (!slot.pickerEntrypoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates requires pickerEntrypoint',
        path: ['pickerEntrypoint']
      });
    }

    if (!slot.publicRendererEntrypoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates requires publicRendererEntrypoint',
        path: ['publicRendererEntrypoint']
      });
    }

    if (slot.publicViewModelVersion !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates requires publicViewModelVersion 1',
        path: ['publicViewModelVersion']
      });
    }

    if (!slot.templates?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'landing.templates requires at least one template',
        path: ['templates']
      });
      return;
    }

    for (const [index, template] of slot.templates.entries()) {
      if (!template.thumbnail) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'landing.templates requires a packaged thumbnail for every template',
          path: ['templates', index, 'thumbnail']
        });
      }
    }
  });
export type TPluginSlotContribution = z.infer<typeof ZPluginSlotContribution>;

export const ZPluginContributions = z
  .object({
    navigation: z.array(ZPluginNavigationContribution).optional().default([]),
    pages: z.array(ZPluginPageContribution).optional().default([]),
    actions: z.array(ZPluginActionContribution).optional().default([]),
    slots: z.array(ZPluginSlotContribution).optional().default([])
  })
  .strict();
export type TPluginContributions = z.infer<typeof ZPluginContributions>;

export const ZPluginRuntimeUiEntrypointObject = z
  .object({
    renderMode: z.literal('custom').default('custom'),
    resource: ZSafeRelativePath
  })
  .strict();
export type TPluginRuntimeUiEntrypointObject = z.infer<typeof ZPluginRuntimeUiEntrypointObject>;

export const ZPluginRuntimeUiEntrypoint = z.union([ZSafeRelativePath, ZPluginRuntimeUiEntrypointObject]);
export type TPluginRuntimeUiEntrypoint = z.infer<typeof ZPluginRuntimeUiEntrypoint>;

export function resolveEntrypointResource(entrypoint: TPluginRuntimeUiEntrypoint | undefined): string | undefined {
  if (!entrypoint) return undefined;
  if (typeof entrypoint === 'string') return entrypoint;
  return entrypoint.resource;
}

export const ZPluginRuntimeUi = z
  .object({
    entrypoints: z.record(z.string(), ZPluginRuntimeUiEntrypoint)
  })
  .strict();
export type TPluginRuntimeUi = z.infer<typeof ZPluginRuntimeUi>;

export const ZPluginRuntime = z
  .object({
    ui: ZPluginRuntimeUi.optional()
  })
  .strict();
export type TPluginRuntime = z.infer<typeof ZPluginRuntime>;

export const ZPluginEngines = z
  .object({
    classroomio: z.string().trim().min(1),
    pluginApi: z.string().trim().min(1)
  })
  .strict();
export type TPluginEngines = z.infer<typeof ZPluginEngines>;

export const ZPluginPermissions = z
  .object({
    required: z.array(ZPluginPermissionScope).default([]),
    optional: z.array(ZPluginPermissionScope).optional().default([])
  })
  .strict();
export type TPluginPermissions = z.infer<typeof ZPluginPermissions>;

export const ZPluginNetworkAccess = z
  .object({
    allowedDomains: z
      .array(
        z.string().url().refine(isAllowedNetworkOrigin, {
          message: 'Allowed domain must be an exact HTTPS origin (or localhost HTTP origin for local dev)'
        })
      )
      .default([])
  })
  .strict();
export type TPluginNetworkAccess = z.infer<typeof ZPluginNetworkAccess>;

export const ZPluginDataPolicy = z
  .object({
    storesCustomerData: z.boolean(),
    retentionAfterUninstallDays: z.number().int().min(0).max(90).default(30),
    privacyPolicyUrl: z.string().url().optional()
  })
  .strict();
export type TPluginDataPolicy = z.infer<typeof ZPluginDataPolicy>;

export interface TPluginJsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;
  properties?: Record<string, TPluginJsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: TPluginJsonSchema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
}

export const ZPluginJsonSchema: z.ZodType<TPluginJsonSchema> = z.lazy(() =>
  z
    .object({
      type: z.enum(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null']),
      title: z.string().trim().min(1).max(100).optional(),
      description: z.string().trim().max(280).optional(),
      default: z.json().optional(),
      enum: z.array(z.json()).min(1).optional(),
      const: z.json().optional(),
      properties: z.record(z.string(), ZPluginJsonSchema).optional(),
      required: z.array(z.string().trim().min(1)).optional(),
      additionalProperties: z.boolean().optional(),
      items: ZPluginJsonSchema.optional(),
      minItems: z.number().int().min(0).optional(),
      maxItems: z.number().int().min(0).optional(),
      minLength: z.number().int().min(0).optional(),
      maxLength: z.number().int().min(0).optional(),
      pattern: z
        .string()
        .max(256)
        .refine((pattern) => {
          try {
            new RegExp(pattern);
            return true;
          } catch {
            return false;
          }
        })
        .optional(),
      minimum: z.number().finite().optional(),
      maximum: z.number().finite().optional()
    })
    .strict()
    .superRefine((schema, ctx) => {
      if (
        schema.type !== 'object' &&
        (schema.properties || schema.required || schema.additionalProperties !== undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Object keywords require type "object"'
        });
      }

      if (schema.type !== 'array' && (schema.items || schema.minItems !== undefined || schema.maxItems !== undefined)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Array keywords require type "array"'
        });
      }

      if (
        schema.type !== 'string' &&
        (schema.minLength !== undefined || schema.maxLength !== undefined || schema.pattern !== undefined)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'String keywords require type "string"'
        });
      }

      if (schema.type !== 'number' && schema.type !== 'integer') {
        if (schema.minimum !== undefined || schema.maximum !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Numeric keywords require type "number" or "integer"'
          });
        }
      }
    })
);

function jsonValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getJsonSchemaValidationError(value: unknown, schema: TPluginJsonSchema, path: string): string | null {
  const valueType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
  const typeMatches =
    schema.type === 'integer' ? typeof value === 'number' && Number.isInteger(value) : schema.type === valueType;

  if (!typeMatches) {
    return `${path} must be a ${schema.type}`;
  }

  if (schema.const !== undefined && !jsonValuesEqual(value, schema.const)) {
    return `${path} must match the declared constant`;
  }

  if (schema.enum && !schema.enum.some((candidate) => jsonValuesEqual(value, candidate))) {
    return `${path} must match one of the declared values`;
  }

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) return `${path} is too short`;
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return `${path} is too long`;
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) return `${path} has an invalid format`;
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) return `${path} is below the minimum`;
    if (schema.maximum !== undefined && value > schema.maximum) return `${path} is above the maximum`;
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return `${path} has too few items`;
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return `${path} has too many items`;
    if (schema.items) {
      for (const [index, item] of value.entries()) {
        const error = getJsonSchemaValidationError(item, schema.items, `${path}[${index}]`);
        if (error) return error;
      }
    }
  }

  if (valueType === 'object') {
    const objectValue = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in objectValue)) return `${path}.${key} is required`;
    }

    for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
      if (!(key in objectValue)) continue;

      const error = getJsonSchemaValidationError(objectValue[key], propertySchema, `${path}.${key}`);
      if (error) return error;
    }

    if (schema.additionalProperties === false) {
      const declaredProperties = new Set(Object.keys(schema.properties ?? {}));
      const unknownProperty = Object.keys(objectValue).find((key) => !declaredProperties.has(key));
      if (unknownProperty) return `${path}.${unknownProperty} is not allowed`;
    }
  }

  return null;
}

export function validatePluginJsonValue(value: unknown, schema: TPluginJsonSchema): string | null {
  return getJsonSchemaValidationError(value, schema, '$');
}

export const ZPluginStorageDocument = z
  .object({
    namespace: z.string().trim().min(1).max(64),
    scope: z.enum(['organization', 'user', 'resource']),
    schemaVersion: z.number().int().min(1),
    schema: ZPluginJsonSchema
  })
  .strict();
export type TPluginStorageDocument = z.infer<typeof ZPluginStorageDocument>;

export const ZPluginStorage = z
  .object({
    documents: z.array(ZPluginStorageDocument).max(32).default([])
  })
  .strict()
  .superRefine((storage, ctx) => {
    const seenDocuments = new Set<string>();
    for (const [index, document] of storage.documents.entries()) {
      const identifier = `${document.scope}:${document.namespace}`;
      if (seenDocuments.has(identifier)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Storage document namespaces must be unique within each scope',
          path: ['documents', index, 'namespace']
        });
      }
      seenDocuments.add(identifier);
    }
  });
export type TPluginStorage = z.infer<typeof ZPluginStorage>;

export const ZPluginManifest = z
  .object({
    $schema: z.string().url().optional(),
    manifestVersion: z.literal(1),
    id: z.string().trim().min(3).max(128).regex(REVERSE_DOMAIN_ID_REGEX, {
      message: 'Plugin ID must be in reverse-domain format (e.g. "com.classroomio.certificate-studio")'
    }),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Plugin slug must be lowercase kebab-case (e.g. "certificate-studio")'
      })
      .optional(),
    name: z.string().trim().min(2).max(64),
    version: z.string().trim().regex(SEMVER_REGEX, {
      message: 'Plugin version must follow SemVer 2.0 (e.g. "1.0.0")'
    }),
    description: z.string().trim().min(5).max(500),
    publisher: z.string().trim().min(2).max(64),
    icon: ZPluginIcon.optional(),
    license: z.string().trim().max(64).optional(),
    homepage: z.string().url().optional(),
    repository: z.string().url().optional(),
    engines: ZPluginEngines,
    runtime: ZPluginRuntime.optional(),
    permissions: ZPluginPermissions.default({ required: [], optional: [] }),
    networkAccess: ZPluginNetworkAccess.optional().default({ allowedDomains: [] }),
    contributes: ZPluginContributions.optional().default({
      navigation: [],
      pages: [],
      actions: [],
      slots: []
    }),
    settings: z
      .object({
        schema: ZPluginJsonSchema.optional()
      })
      .strict()
      .optional(),
    storage: ZPluginStorage.optional(),
    dataPolicy: ZPluginDataPolicy,
    extensions: z.record(z.string(), z.unknown()).optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dataPolicy.storesCustomerData && !data.dataPolicy.privacyPolicyUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'privacyPolicyUrl is required when storesCustomerData is true',
        path: ['dataPolicy', 'privacyPolicyUrl']
      });
    }

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

    const declaredPageIds = new Set(data.contributes.pages.map((page) => page.id));
    for (const [idx, navigationItem] of data.contributes.navigation.entries()) {
      if (!declaredPageIds.has(navigationItem.page)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Navigation item "${navigationItem.id}" references undeclared page "${navigationItem.page}"`,
          path: ['contributes', 'navigation', idx, 'page']
        });
      }
    }

    for (const [idx, action] of data.contributes.actions.entries()) {
      const actionOrigin = getUrlTemplateOrigin(action.urlTemplate);
      const allowedOrigins = data.networkAccess.allowedDomains.map((domain) => new URL(domain).origin);

      if (!actionOrigin || !allowedOrigins.includes(actionOrigin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Action "${action.id}" URL origin must be declared in networkAccess.allowedDomains`,
          path: ['contributes', 'actions', idx, 'urlTemplate']
        });
      }
    }

    for (const [idx, slot] of data.contributes.slots.entries()) {
      const entrypointNames =
        slot.target === 'landing.templates'
          ? [slot.pickerEntrypoint, slot.publicRendererEntrypoint]
          : [slot.entrypoint];

      for (const entrypointName of entrypointNames) {
        if (
          (slot.renderMode === 'custom' || entrypointName) &&
          (!entrypointName || !declaredEntrypoints[entrypointName])
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Slot "${slot.id}" references undeclared ui.entrypoint "${entrypointName}"`,
            path: ['contributes', 'slots', idx]
          });
        }
      }
    }

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
