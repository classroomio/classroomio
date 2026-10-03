import * as z from 'zod';

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

export const ONBOARDING_JOB_ROLES = ['founder', 'product-ops', 'cs-education', 'developer', OTHER_VALUE] as const;

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

export const ONBOARDING_LOCALES = ['en', 'hi', 'fr', 'pt', 'de', 'vi', 'ru', 'es', 'pl', 'da'] as const;

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), z.enum(values).optional());
}

export const ZOnboardingCreateOrg = z.object({
  fullname: fullnameValidation,
  orgName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.organization_name.hyphen_rule'
    }),
  siteName: z
    .string()
    .min(5)
    .refine((val) => !/^[-]|[-]$/.test(val), {
      message: 'validations.site_name.hyphen_rule'
    })
});
export type TOnboardingCreateOrg = z.infer<typeof ZOnboardingCreateOrg>;

export const ZOnboardingUpdateMetadata = z
  .object({
    fullname: fullnameValidation,
    useCases: z.array(z.enum(ONBOARDING_USE_CASES)),
    useCaseOther: otherText,
    learningMethod: optionalEnum(ONBOARDING_LEARNING_METHODS),
    learningMethodOther: otherText,
    companySize: optionalEnum(ONBOARDING_COMPANY_SIZES),
    jobRole: optionalEnum(ONBOARDING_JOB_ROLES),
    jobRoleOther: otherText,
    source: optionalEnum(ONBOARDING_SOURCES),
    sourceOther: otherText,
    aiProvider: optionalEnum(ONBOARDING_AI_PROVIDERS),
    aiProviderOther: otherText,
    locale: optionalEnum(ONBOARDING_LOCALES)
  })
  .superRefine((data, ctx) => {
    if (data.useCases.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['useCases'], message: 'validations.generic.required_field' });
    }

    if (!data.learningMethod) {
      ctx.addIssue({ code: 'custom', path: ['learningMethod'], message: 'validations.generic.required_field' });
    }

    if (!data.companySize) {
      ctx.addIssue({ code: 'custom', path: ['companySize'], message: 'validations.generic.required_field' });
    }

    if (!data.jobRole) {
      ctx.addIssue({ code: 'custom', path: ['jobRole'], message: 'validations.generic.required_field' });
    }

    if (data.useCases.includes(OTHER_VALUE) && !data.useCaseOther) {
      ctx.addIssue({ code: 'custom', path: ['useCaseOther'], message: 'onboarding.other_required' });
    }

    if (data.learningMethod === OTHER_VALUE && !data.learningMethodOther) {
      ctx.addIssue({ code: 'custom', path: ['learningMethodOther'], message: 'onboarding.other_required' });
    }

    if (data.jobRole === OTHER_VALUE && !data.jobRoleOther) {
      ctx.addIssue({ code: 'custom', path: ['jobRoleOther'], message: 'onboarding.other_required' });
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
export type TOnboardingUpdateMetadata = z.infer<typeof ZOnboardingUpdateMetadata>;
