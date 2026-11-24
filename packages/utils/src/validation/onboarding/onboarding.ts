import * as z from 'zod';

import {
  LANDING_PAGE_THEMES,
  ONBOARDING_BRAND_PRESETS,
  ONBOARDING_COMPLETION_ROUTES,
  ONBOARDING_TOUR_STATUSES,
  ONBOARDING_TOUR_STEP_IDS,
  STARTER_COURSE_SLOTS,
  blockedSubdomain
} from '../../constants';
import { normalizeWebsiteUrl } from './website-url';

const fullnameValidation = z.string().min(5);
const otherText = z.string().trim().max(280).optional();

const OTHER_VALUE = 'other';

export const ONBOARDING_USE_CASES = [
  'customer-training',
  'customer-certification',
  'partner-training',
  'team-training',
  'sell-courses',
  OTHER_VALUE
] as const;

export const ONBOARDING_LEARNING_METHODS = [
  'self-serve',
  'live-onboarding',
  'help-docs',
  'no-training',
  OTHER_VALUE
] as const;

export const ONBOARDING_COMPANY_SIZES = ['solo', '2-9', '10-50', '51-200', '200-plus'] as const;

export const ONBOARDING_LEARNING_METHOD_OPTIONS = [
  'self-serve',
  'live-onboarding',
  'help-docs',
  'no-training'
] as const;

export const ONBOARDING_JOB_ROLES = [
  'founder',
  'customer-success',
  'customer-education',
  'product',
  'marketing',
  'support',
  'operations',
  'product-ops',
  'cs-education',
  'developer',
  OTHER_VALUE
] as const;

/** Roles offered by the guided onboarding. `ONBOARDING_JOB_ROLES` also keeps the values older accounts saved. */
export const ONBOARDING_JOB_ROLE_OPTIONS = [
  'founder',
  'customer-success',
  'customer-education',
  'product',
  'marketing',
  'support',
  'operations',
  OTHER_VALUE
] as const;

export const ONBOARDING_FIRST_OUTCOMES = [
  'onboard-customers',
  'explain-product',
  'increase-adoption',
  'cut-tickets'
] as const;
export type TOnboardingFirstOutcome = (typeof ONBOARDING_FIRST_OUTCOMES)[number];

export const ONBOARDING_CONTEXT_MODES = ['website', 'description', 'none'] as const;
export type TOnboardingContextMode = (typeof ONBOARDING_CONTEXT_MODES)[number];

export const ONBOARDING_DESCRIPTION_MIN_LENGTH = 20;
export const ONBOARDING_DESCRIPTION_MAX_LENGTH = 1000;
export const STARTER_COURSE_TITLE_MAX_LENGTH = 120;

export const ONBOARDING_SOURCES = [
  'blog',
  'ai',
  'search-engine',
  'github',
  'youtube',
  'social-media',
  'product-hunt',
  'friends-family',
  OTHER_VALUE
] as const;

export const ONBOARDING_AI_PROVIDERS = ['chatgpt', 'claude', 'gemini', 'grok', 'perplexity', OTHER_VALUE] as const;

export const ONBOARDING_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da', 'tr', 'it'] as const;

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), z.enum(values).optional());
}

function clearableOptionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((value) => (value === '' ? null : value), z.enum(values).nullable().optional()).optional();
}

export const SITE_NAME_RESERVED_MESSAGE = 'validations.site_name.reserved';

export const ZOnboardingCreateOrg = z.object({
  fullname: fullnameValidation,
  orgName: z
    .string()
    .min(5, 'validations.organization_name.min_char')
    .max(120, 'validations.organization_name.max_char')
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.organization_name.hyphen_rule'
    }),
  siteName: z
    .string()
    .min(5, 'validations.site_name.min_char')
    .max(63, 'validations.site_name.max_char')
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.site_name.hyphen_rule'
    })
    .refine((val) => /^[a-z0-9-]+$/.test(val), {
      message: 'validations.site_name.characters'
    })
    .refine((val) => !blockedSubdomain.includes(val), {
      message: SITE_NAME_RESERVED_MESSAGE
    })
});
export type TOnboardingCreateOrg = z.infer<typeof ZOnboardingCreateOrg>;

const ZWebsiteUrl = z
  .string()
  .trim()
  .max(2048)
  .transform((value, ctx) => {
    const normalized = normalizeWebsiteUrl(value);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'onboarding.v2.business.errors.website_invalid' });

      return z.NEVER;
    }

    return normalized;
  });

const ZOnboardingBusinessFields = z.object({
  firstOutcome: z.enum(ONBOARDING_FIRST_OUTCOMES),
  contextMode: z.enum(ONBOARDING_CONTEXT_MODES),
  websiteUrl: ZWebsiteUrl.optional(),
  description: z.string().trim().max(ONBOARDING_DESCRIPTION_MAX_LENGTH).optional(),
  jobRole: z.enum(ONBOARDING_JOB_ROLE_OPTIONS),
  companySize: z.enum(ONBOARDING_COMPANY_SIZES),
  learningMethod: z.enum(ONBOARDING_LEARNING_METHOD_OPTIONS),
  source: clearableOptionalEnum(ONBOARDING_SOURCES),
  sourceOther: otherText,
  aiProvider: clearableOptionalEnum(ONBOARDING_AI_PROVIDERS),
  aiProviderOther: otherText
});

export const ZOnboardingBusiness = ZOnboardingBusinessFields.superRefine((data, ctx) => {
  if (data.contextMode === 'website' && !data.websiteUrl) {
    ctx.addIssue({ code: 'custom', path: ['websiteUrl'], message: 'onboarding.v2.business.errors.website_required' });
  }

  if (data.contextMode === 'description' && (data.description?.length ?? 0) < ONBOARDING_DESCRIPTION_MIN_LENGTH) {
    ctx.addIssue({
      code: 'custom',
      path: ['description'],
      message: 'onboarding.v2.business.errors.description_required'
    });
  }

  if (data.source === OTHER_VALUE && !data.sourceOther) {
    ctx.addIssue({ code: 'custom', path: ['sourceOther'], message: 'onboarding.other_required' });
  }

  if (data.source === 'ai' && !data.aiProvider) {
    ctx.addIssue({ code: 'custom', path: ['aiProvider'], message: 'onboarding.ai_required' });
  }

  if (data.aiProvider === OTHER_VALUE && !data.aiProviderOther) {
    ctx.addIssue({ code: 'custom', path: ['aiProviderOther'], message: 'onboarding.other_required' });
  }
});
export type TOnboardingBusiness = z.infer<typeof ZOnboardingBusiness>;

/**
 * Answers saved while the user is still typing. Every field is optional and the website is kept as typed.
 * The academy identity fields live here too, so the first business item persists without a separate screen.
 */
export const ZOnboardingBusinessDraft = z.object({
  fullname: z.string().trim().max(120).nullable().optional(),
  orgName: z.string().trim().max(120).nullable().optional(),
  siteName: z.string().trim().max(63).nullable().optional(),
  firstOutcome: z.enum(ONBOARDING_FIRST_OUTCOMES).nullable().optional(),
  contextMode: z.enum(ONBOARDING_CONTEXT_MODES).nullable().optional(),
  websiteUrl: z.string().trim().max(2048).nullable().optional(),
  description: z.string().max(ONBOARDING_DESCRIPTION_MAX_LENGTH).nullable().optional(),
  jobRole: z.enum(ONBOARDING_JOB_ROLE_OPTIONS).nullable().optional(),
  companySize: z.enum(ONBOARDING_COMPANY_SIZES).nullable().optional(),
  learningMethod: z.enum(ONBOARDING_LEARNING_METHOD_OPTIONS).nullable().optional(),
  source: z.enum(ONBOARDING_SOURCES).nullable().optional(),
  sourceOther: z.string().trim().max(280).nullable().optional(),
  aiProvider: z.enum(ONBOARDING_AI_PROVIDERS).nullable().optional(),
  aiProviderOther: z.string().trim().max(280).nullable().optional()
});
export type TOnboardingBusinessDraft = z.infer<typeof ZOnboardingBusinessDraft>;

export const ZOnboardingStart = z.object({ termsAccepted: z.boolean().default(false) });
export type TOnboardingStart = z.infer<typeof ZOnboardingStart>;

export const ZOnboardingSiteNameCheck = z.object({ siteName: z.string().trim().toLowerCase().max(63) });

export const ZOnboardingWorkspace = ZOnboardingCreateOrg;
export type TOnboardingWorkspace = z.infer<typeof ZOnboardingWorkspace>;

const HEX_COLOUR_PATTERN = /^#[0-9a-f]{6}$/i;

export const ZHexColour = z.string().regex(HEX_COLOUR_PATTERN, 'validations.organization.theme_color');

export const ZOnboardingBrandColour = z.union([z.enum(ONBOARDING_BRAND_PRESETS), ZHexColour]);
export type TOnboardingBrandColour = z.infer<typeof ZOnboardingBrandColour>;

export const ZOnboardingCustomise = z.object({
  orgName: ZOnboardingCreateOrg.shape.orgName,
  brandColour: ZOnboardingBrandColour,
  landingTheme: z.enum(LANDING_PAGE_THEMES)
});
export type TOnboardingCustomise = z.infer<typeof ZOnboardingCustomise>;

export const ZOnboardingStarterRename = z.object({
  title: z.string().trim().min(1, 'onboarding.v2.starter.title_required').max(STARTER_COURSE_TITLE_MAX_LENGTH)
});
export const ZOnboardingStarterSlotParam = z.object({ slot: z.enum(STARTER_COURSE_SLOTS) });

export const ZOnboardingComplete = z.object({ via: z.enum(ONBOARDING_COMPLETION_ROUTES) });
export type TOnboardingComplete = z.infer<typeof ZOnboardingComplete>;

export const ZOnboardingTourUpdate = z
  .object({
    status: z.enum(['active', 'dismissed', 'completed']).optional(),
    completedStepId: z.enum(ONBOARDING_TOUR_STEP_IDS).optional()
  })
  .refine((data) => data.status !== undefined || data.completedStepId !== undefined, {
    message: 'validations.generic.required_field'
  });
export type TOnboardingTourUpdate = z.infer<typeof ZOnboardingTourUpdate>;

export const ZOnboardingTour = z.object({
  status: z.enum(ONBOARDING_TOUR_STATUSES).default('pending'),
  completedStepIds: z.array(z.enum(ONBOARDING_TOUR_STEP_IDS)).default([])
});
export type TOnboardingTour = z.infer<typeof ZOnboardingTour>;

export const ZOnboardingBrand = z.object({
  detectedColour: ZHexColour.nullable().optional(),
  colourAdjusted: z.boolean().optional(),
  detectedLogoUrl: z.url().nullable().optional(),
  siteTitle: z.string().max(120).nullable().optional(),
  productName: z.string().max(80).nullable().optional()
});
export type TOnboardingBrand = z.infer<typeof ZOnboardingBrand>;
