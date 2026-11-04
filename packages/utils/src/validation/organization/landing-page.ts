import * as z from 'zod';

export const NATIVE_LANDING_PAGE_THEMES = [
  'minimal',
  'bold',
  'classic',
  'saas',
  'tech',
  'studio',
  'corporate',
  'terminal',
  'editorial',
  'vibrant',
  'quartz'
] as const;

export const DEFAULT_NATIVE_LANDING_PAGE_THEME = 'quartz' as const;

export const ZNativeLandingPageTheme = z.enum(NATIVE_LANDING_PAGE_THEMES);
export type NativeLandingPageTheme = z.infer<typeof ZNativeLandingPageTheme>;

export const ZLandingPageAppearanceNative = z
  .object({
    kind: z.literal('native'),
    theme: ZNativeLandingPageTheme
  })
  .strict();
export type TLandingPageAppearanceNative = z.infer<typeof ZLandingPageAppearanceNative>;

export const ZLandingPageAppearancePlugin = z
  .object({
    kind: z.literal('plugin'),
    fallbackTheme: ZNativeLandingPageTheme,
    installationId: z.string().uuid(),
    pluginId: z.string().trim().min(1).max(128),
    contributionId: z.string().trim().min(1).max(64),
    templateId: z.string().trim().min(1).max(64),
    version: z.string().trim().min(1).max(64)
  })
  .strict();
export type TLandingPageAppearancePlugin = z.infer<typeof ZLandingPageAppearancePlugin>;

export const ZLandingPageAppearance = z.discriminatedUnion('kind', [
  ZLandingPageAppearanceNative,
  ZLandingPageAppearancePlugin
]);
export type LandingPageAppearance = z.infer<typeof ZLandingPageAppearance>;

/**
 * Checks whether an unknown value is an allowed native landing page theme key.
 */
export function isNativeLandingPageTheme(value: unknown): value is NativeLandingPageTheme {
  return ZNativeLandingPageTheme.safeParse(value).success;
}

/**
 * Checks whether an unknown value is a valid landing page appearance object.
 */
export function isLandingPageAppearance(value: unknown): value is LandingPageAppearance {
  return ZLandingPageAppearance.safeParse(value).success;
}

/**
 * Normalizes appearance configuration, supporting legacy string theme values.
 */
export function normalizeLandingPageAppearance(rawAppearance: unknown, rawTheme?: unknown): LandingPageAppearance {
  const parsed = ZLandingPageAppearance.safeParse(rawAppearance);
  if (parsed.success) {
    return parsed.data;
  }

  if (isNativeLandingPageTheme(rawTheme)) {
    return {
      kind: 'native',
      theme: rawTheme
    };
  }

  return {
    kind: 'native',
    theme: DEFAULT_NATIVE_LANDING_PAGE_THEME
  };
}

export const ZGetPublicLandingPageQuery = z.object({
  siteName: z.string().trim().min(1),
  templateId: z.string().trim().optional()
});
export type TGetPublicLandingPageQuery = z.infer<typeof ZGetPublicLandingPageQuery>;

export const ZPublicLandingPluginDescriptor = z
  .object({
    pluginId: z.string(),
    version: z.string(),
    artifactDigest: z.string(),
    entrypointUrl: z.string(),
    templateId: z.string(),
    templateName: z.string()
  })
  .strict();
export type PublicLandingPluginDescriptor = z.infer<typeof ZPublicLandingPluginDescriptor>;

export const ZPublicLandingPageResponse = z
  .object({
    appearance: ZLandingPageAppearance,
    isPlugin: z.boolean(),
    pluginDescriptor: ZPublicLandingPluginDescriptor.optional(),
    fallbackTheme: ZNativeLandingPageTheme
  })
  .strict();
export type PublicLandingPageResponse = z.infer<typeof ZPublicLandingPageResponse>;
