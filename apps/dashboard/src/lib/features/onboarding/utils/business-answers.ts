import { getWebsiteHost, normalizeWebsiteUrl } from '@cio/utils/validation/onboarding';
import type { OnboardingBusinessDraftInput, OnboardingBusinessInput } from './types';

export type BusinessAnswers = {
  fullname: string;
  orgName: string;
  siteName: string;
  firstOutcome: string;
  contextMode: '' | 'website' | 'description' | 'none';
  websiteUrl: string;
  description: string;
  jobRole: string;
  companySize: string;
  learningMethod: string;
  source: string;
  sourceOther: string;
  aiProvider: string;
  aiProviderOther: string;
};

type StoredBusinessAnswers = Partial<Record<keyof BusinessAnswers, string | null>>;

export function emptyBusinessAnswers(): BusinessAnswers {
  return {
    fullname: '',
    orgName: '',
    siteName: '',
    firstOutcome: '',
    contextMode: '',
    websiteUrl: '',
    description: '',
    jobRole: '',
    companySize: '',
    learningMethod: '',
    source: '',
    sourceOther: '',
    aiProvider: '',
    aiProviderOther: ''
  };
}

/**
 * The session row stores unanswered fields as `null`. Forms bind to plain strings, so every null
 * becomes an empty string here instead of leaking into a submit payload later.
 */
export function readBusinessAnswers(stored: StoredBusinessAnswers | null | undefined): BusinessAnswers {
  const empty = emptyBusinessAnswers();
  if (!stored) return empty;

  return {
    fullname: stored.fullname ?? empty.fullname,
    orgName: stored.orgName ?? empty.orgName,
    siteName: stored.siteName ?? empty.siteName,
    firstOutcome: stored.firstOutcome ?? empty.firstOutcome,
    contextMode: (stored.contextMode ?? empty.contextMode) as BusinessAnswers['contextMode'],
    websiteUrl: stored.websiteUrl ?? empty.websiteUrl,
    description: stored.description ?? empty.description,
    jobRole: stored.jobRole ?? empty.jobRole,
    companySize: stored.companySize ?? empty.companySize,
    learningMethod: stored.learningMethod ?? empty.learningMethod,
    source: stored.source ?? empty.source,
    sourceOther: stored.sourceOther ?? empty.sourceOther,
    aiProvider: stored.aiProvider ?? empty.aiProvider,
    aiProviderOther: stored.aiProviderOther ?? empty.aiProviderOther
  };
}

export function businessDraftFromAnswers(answers: BusinessAnswers): OnboardingBusinessDraftInput {
  return {
    fullname: answers.fullname.trim() || null,
    orgName: answers.orgName.trim() || null,
    siteName: answers.siteName.trim() || null,
    firstOutcome: (answers.firstOutcome || null) as OnboardingBusinessDraftInput['firstOutcome'],
    contextMode: answers.contextMode || null,
    websiteUrl: answers.websiteUrl.trim() || null,
    description: answers.description || null,
    jobRole: (answers.jobRole || null) as OnboardingBusinessDraftInput['jobRole'],
    companySize: (answers.companySize || null) as OnboardingBusinessDraftInput['companySize'],
    learningMethod: (answers.learningMethod || null) as OnboardingBusinessDraftInput['learningMethod'],
    source: (answers.source || null) as OnboardingBusinessDraftInput['source'],
    sourceOther: answers.sourceOther.trim() || null,
    aiProvider: (answers.aiProvider || null) as OnboardingBusinessDraftInput['aiProvider'],
    aiProviderOther: answers.aiProviderOther.trim() || null
  };
}

export function businessSubmitFromAnswers(answers: BusinessAnswers): OnboardingBusinessInput {
  const websiteUrl = answers.websiteUrl ? normalizeWebsiteUrl(answers.websiteUrl) : null;

  return {
    firstOutcome: answers.firstOutcome as OnboardingBusinessInput['firstOutcome'],
    contextMode: (answers.contextMode || 'none') as OnboardingBusinessInput['contextMode'],
    websiteUrl: websiteUrl ?? undefined,
    description: answers.description.trim() || undefined,
    jobRole: answers.jobRole as OnboardingBusinessInput['jobRole'],
    companySize: answers.companySize as OnboardingBusinessInput['companySize'],
    learningMethod: answers.learningMethod as OnboardingBusinessInput['learningMethod'],
    source: (answers.source || null) as OnboardingBusinessInput['source'],
    sourceOther: answers.sourceOther.trim() || undefined,
    aiProvider: (answers.aiProvider || null) as OnboardingBusinessInput['aiProvider'],
    aiProviderOther: answers.aiProviderOther.trim() || undefined
  };
}

export const BUSINESS_QUICK_ROLES = ['founder', 'customer-success', 'customer-education', 'product'] as const;
export const BUSINESS_MORE_ROLES = ['marketing', 'support', 'operations', 'other'] as const;

/**
 * Short label for the business block in the workspace preview: the website host, the description,
 * or the sample-content label when the user skipped. Empty while the item is unanswered.
 */
export function businessBlockLabel(answers: BusinessAnswers, samplesLabel: string): string {
  if (answers.contextMode === 'none') return samplesLabel;
  if (answers.contextMode === 'description') return answers.description.trim();
  if (answers.contextMode === 'website') return getWebsiteHost(answers.websiteUrl) ?? '';

  return '';
}

export const BUSINESS_COMPANY_SIZE_LABELS: Record<string, string> = {
  solo: 'onboarding.v2.business.sizes.solo',
  '2-9': 'onboarding.v2.business.sizes.small',
  '10-50': 'onboarding.v2.business.sizes.medium',
  '51-200': 'onboarding.v2.business.sizes.large',
  '200-plus': 'onboarding.v2.business.sizes.enterprise'
};
