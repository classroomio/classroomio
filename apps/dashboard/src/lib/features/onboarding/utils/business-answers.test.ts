import { describe, expect, it } from 'vitest';
import { ZOnboardingBusiness } from '@cio/utils/validation/onboarding';
import {
  businessDraftFromAnswers,
  businessSubmitFromAnswers,
  emptyBusinessAnswers,
  readBusinessAnswers
} from './business-answers';

const answeredStored = {
  firstOutcome: 'onboard-customers',
  contextMode: 'none' as const,
  websiteUrl: null,
  description: null,
  jobRole: 'founder',
  companySize: 'solo',
  learningMethod: 'self-serve',
  source: null,
  sourceOther: null,
  aiProvider: null,
  aiProviderOther: null
};

describe('readBusinessAnswers', () => {
  it('returns empty strings for a missing draft', () => {
    expect(readBusinessAnswers(null)).toEqual(emptyBusinessAnswers());
  });

  it('turns stored nulls into empty strings', () => {
    const answers = readBusinessAnswers(answeredStored);

    expect(answers.description).toBe('');
    expect(answers.websiteUrl).toBe('');
    expect(answers.source).toBe('');
    expect(answers.aiProvider).toBe('');
    expect(answers.contextMode).toBe('none');
  });

  it('keeps the answers the user already gave', () => {
    const answers = readBusinessAnswers(answeredStored);

    expect(answers.firstOutcome).toBe('onboard-customers');
    expect(answers.jobRole).toBe('founder');
    expect(answers.companySize).toBe('solo');
    expect(answers.learningMethod).toBe('self-serve');
  });
});

describe('businessDraftFromAnswers', () => {
  it('saves blanks as null so an unfinished draft stays clearable', () => {
    const draft = businessDraftFromAnswers({ ...emptyBusinessAnswers(), jobRole: 'founder' });

    expect(draft).toEqual({
      fullname: null,
      orgName: null,
      siteName: null,
      firstOutcome: null,
      contextMode: null,
      websiteUrl: null,
      description: null,
      jobRole: 'founder',
      companySize: null,
      learningMethod: null,
      source: null,
      sourceOther: null,
      aiProvider: null,
      aiProviderOther: null
    });
  });

  it('keeps the website exactly as typed', () => {
    const draft = businessDraftFromAnswers({ ...emptyBusinessAnswers(), websiteUrl: 'acme' });

    expect(draft.websiteUrl).toBe('acme');
  });
});

describe('businessSubmitFromAnswers', () => {
  it('validates a hydrated draft that chose no business context', () => {
    const answers = readBusinessAnswers(answeredStored);
    const payload = businessSubmitFromAnswers(answers);

    const result = ZOnboardingBusiness.safeParse(payload);

    expect(result.success).toBe(true);
  });

  it('sends no null optional strings', () => {
    const payload = businessSubmitFromAnswers(readBusinessAnswers(answeredStored));

    expect(payload.websiteUrl).toBeUndefined();
    expect(payload.description).toBeUndefined();
    expect(payload.sourceOther).toBeUndefined();
    expect(payload.aiProviderOther).toBeUndefined();
    expect(payload.source).toBeNull();
    expect(payload.aiProvider).toBeNull();
  });

  it('falls back to the sample context when nothing was chosen', () => {
    const payload = businessSubmitFromAnswers(emptyBusinessAnswers());

    expect(payload.contextMode).toBe('none');
  });

  it('normalises a website the user typed as a bare domain', () => {
    const payload = businessSubmitFromAnswers({
      ...emptyBusinessAnswers(),
      firstOutcome: 'explain-product',
      contextMode: 'website',
      websiteUrl: 'acme.com',
      jobRole: 'product',
      companySize: '10-50',
      learningMethod: 'help-docs'
    });

    expect(payload.websiteUrl).toBe('https://acme.com/');
    expect(ZOnboardingBusiness.safeParse(payload).success).toBe(true);
  });

  it('keeps a source of other with its description', () => {
    const payload = businessSubmitFromAnswers({
      ...readBusinessAnswers(answeredStored),
      source: 'other',
      sourceOther: 'A podcast'
    });

    expect(ZOnboardingBusiness.safeParse(payload).success).toBe(true);
  });
});
