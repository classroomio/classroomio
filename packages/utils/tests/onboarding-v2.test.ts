import { describe, expect, it } from 'vitest';

import {
  ONBOARDING_DESCRIPTION_MIN_LENGTH,
  SITE_NAME_RESERVED_MESSAGE,
  ZOnboardingBrandColour,
  ZOnboardingBusiness,
  ZOnboardingCreateOrg
} from '../src/validation/onboarding/onboarding';
import { getWebsiteHost, normalizeWebsiteUrl } from '../src/validation/onboarding/website-url';

const businessPayload = {
  firstOutcome: 'onboard-customers',
  contextMode: 'none',
  jobRole: 'founder',
  companySize: 'solo',
  learningMethod: 'self-serve'
};

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return (result.error?.issues ?? []).map((issue) => issue.path.join('.'));
}

describe('ZOnboardingBusiness', () => {
  it('accepts answers that carry no context', () => {
    expect(ZOnboardingBusiness.safeParse(businessPayload).success).toBe(true);
  });

  it('requires a website when the website mode is selected', () => {
    const result = ZOnboardingBusiness.safeParse({ ...businessPayload, contextMode: 'website' });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('websiteUrl');
  });

  it('normalises a bare domain in the website mode', () => {
    const result = ZOnboardingBusiness.safeParse({
      ...businessPayload,
      contextMode: 'website',
      websiteUrl: 'Acme.com/products'
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.websiteUrl).toBe('https://acme.com/products');
  });

  it('requires a description long enough to analyse', () => {
    const result = ZOnboardingBusiness.safeParse({
      ...businessPayload,
      contextMode: 'description',
      description: 'Too short'
    });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('description');
  });

  it('accepts a description at the minimum length', () => {
    const result = ZOnboardingBusiness.safeParse({
      ...businessPayload,
      contextMode: 'description',
      description: 'a'.repeat(ONBOARDING_DESCRIPTION_MIN_LENGTH)
    });

    expect(result.success).toBe(true);
  });

  it('requires free text when a source is "other"', () => {
    const result = ZOnboardingBusiness.safeParse({ ...businessPayload, source: 'other' });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('sourceOther');
  });

  it('requires an AI provider when the source is AI', () => {
    const result = ZOnboardingBusiness.safeParse({ ...businessPayload, source: 'ai' });

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain('aiProvider');
  });

  it('treats an empty AI provider as cleared, not as a value', () => {
    const result = ZOnboardingBusiness.safeParse({
      ...businessPayload,
      source: 'blog',
      aiProvider: ''
    });

    expect(result.success).toBe(true);
  });
});

describe('ZOnboardingCreateOrg.siteName', () => {
  const payload = {
    fullname: 'Ada Lovelace',
    orgName: 'Acme Academy',
    siteName: 'acmeacademy'
  };

  it('accepts a lowercase address', () => {
    expect(ZOnboardingCreateOrg.safeParse(payload).success).toBe(true);
  });

  it.each([
    ['too long', { siteName: 'a'.repeat(64) }, 'validations.site_name.max_char'],
    ['too short', { siteName: 'abcd' }, 'validations.site_name.min_char'],
    ['uppercase', { siteName: 'AcmeCo' }, 'validations.site_name.characters'],
    ['underscore', { siteName: 'acme_co' }, 'validations.site_name.characters'],
    ['leading hyphen', { siteName: '-acme' }, 'validations.site_name.hyphen_rule'],
    ['trailing hyphen', { siteName: 'acme-' }, 'validations.site_name.hyphen_rule'],
    ['reserved', { siteName: 'academy' }, SITE_NAME_RESERVED_MESSAGE]
  ])('rejects %s', (_label, override, message) => {
    const result = ZOnboardingCreateOrg.safeParse({ ...payload, ...override });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message);
  });
});

describe('ZOnboardingBrandColour', () => {
  it.each(['blue', 'rose', 'green', 'orange', 'purple', '#1a2b3c', '#AABBCC'])('accepts %s', (value) => {
    expect(ZOnboardingBrandColour.safeParse(value).success).toBe(true);
  });

  it.each(['teal', '#abc', '#12345', 'rgb(0,0,0)', 'blue;'])('rejects %s', (value) => {
    expect(ZOnboardingBrandColour.safeParse(value).success).toBe(false);
  });
});

describe('normalizeWebsiteUrl', () => {
  it.each([
    ['acme.com', 'https://acme.com/'],
    ['https://www.acme.com/pricing', 'https://www.acme.com/pricing'],
    ['http://acme.co.uk', 'http://acme.co.uk/'],
    ['  acme.dev  ', 'https://acme.dev/']
  ])('normalises %s', (input, expected) => {
    expect(normalizeWebsiteUrl(input)).toBe(expected);
  });

  it('drops the fragment', () => {
    expect(normalizeWebsiteUrl('https://acme.com/pricing#plans')).toBe('https://acme.com/pricing');
  });

  it.each([
    ['empty', ''],
    ['javascript', 'javascript:alert(1)'],
    ['credentials', 'https://user:pass@acme.com'],
    ['port', 'https://acme.com:8443'],
    ['ipv4', 'http://10.0.0.1'],
    ['ipv6', 'http://[::1]'],
    ['single label', 'localhost'],
    ['reserved tld', 'acme.test'],
    ['numeric tld', 'acme.123'],
    ['whitespace', 'acme .com']
  ])('rejects %s', (_label, input) => {
    expect(normalizeWebsiteUrl(input)).toBeNull();
  });

  it('returns a display host without www', () => {
    expect(getWebsiteHost('www.acme.com')).toBe('acme.com');
    expect(getWebsiteHost('not a website')).toBeNull();
  });
});
