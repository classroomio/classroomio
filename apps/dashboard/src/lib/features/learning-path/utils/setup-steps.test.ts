import { describe, expect, it } from 'vitest';
import { isPriceConfigured, hasLandingContent, getSetupSteps } from './setup-steps';
import type { LearningPathDetail } from './types';

function createMockPath(overrides: Partial<LearningPathDetail> = {}): LearningPathDetail {
  return {
    id: 'path-123',
    publicId: 'P1234567',
    organizationId: 'org-123',
    name: 'Test Path',
    slug: 'test-path',
    status: 'ACTIVE',
    description: 'A test learning path description.',
    coverImage: null,
    isPublished: false,
    cost: 0,
    currency: 'USD',
    sequentialUnlock: true,
    selfEnrollment: true,
    certificate: {},
    welcomeEmailMessage: null,
    landingPage: {},
    courseOrderSetAt: null,
    createdByProfileId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    courses: [],
    ...overrides
  } as LearningPathDetail;
}

describe('isPriceConfigured', () => {
  it('returns false when path has default cost 0 and no paymentEnabled flag (unconfigured)', () => {
    const path = createMockPath({ cost: 0, landingPage: {} });
    expect(isPriceConfigured(path)).toBe(false);
  });

  it('returns true when paymentEnabled is explicitly false (free path)', () => {
    const path = createMockPath({
      cost: 0,
      landingPage: { paymentEnabled: false }
    });
    expect(isPriceConfigured(path)).toBe(true);
  });

  it('returns false when paymentEnabled is true but cost is 0', () => {
    const path = createMockPath({
      cost: 0,
      landingPage: {
        paymentEnabled: true,
        paymentLink: 'https://pay.example.com/checkout'
      }
    });
    expect(isPriceConfigured(path)).toBe(false);
  });

  it('returns false when paymentEnabled is true and cost > 0 but paymentLink is missing', () => {
    const path = createMockPath({
      cost: 99,
      landingPage: {
        paymentEnabled: true,
        paymentLink: ''
      }
    });
    expect(isPriceConfigured(path)).toBe(false);
  });

  it('returns true when paymentEnabled is true, cost > 0, and valid paymentLink exists', () => {
    const path = createMockPath({
      cost: 99,
      landingPage: {
        paymentEnabled: true,
        paymentLink: 'https://pay.example.com/checkout'
      }
    });
    expect(isPriceConfigured(path)).toBe(true);
  });

  it('returns true when cost > 0 even if paymentEnabled was not explicitly set', () => {
    const path = createMockPath({
      cost: 49,
      landingPage: {}
    });
    expect(isPriceConfigured(path)).toBe(true);
  });
});

describe('hasLandingContent', () => {
  it('returns false for empty landingPage or whitespace-only fields', () => {
    expect(hasLandingContent(createMockPath({ landingPage: {} }))).toBe(false);
    expect(
      hasLandingContent(
        createMockPath({
          landingPage: {
            title: '   ',
            description: '',
            requirements: ' \n ',
            goals: ''
          }
        })
      )
    ).toBe(false);
  });

  it('returns false when only non-copy metadata or settings are present', () => {
    expect(
      hasLandingContent(
        createMockPath({
          landingPage: {
            skills: [],
            reviews: [],
            faqs: []
          }
        })
      )
    ).toBe(false);
  });

  it('returns true when text content is present in title, description, requirements, or goals', () => {
    expect(hasLandingContent(createMockPath({ landingPage: { title: 'Mastering TypeScript' } }))).toBe(true);
    expect(hasLandingContent(createMockPath({ landingPage: { description: 'A comprehensive path.' } }))).toBe(true);
    expect(hasLandingContent(createMockPath({ landingPage: { requirements: 'Basic JavaScript.' } }))).toBe(true);
    expect(hasLandingContent(createMockPath({ landingPage: { goals: 'Build production apps.' } }))).toBe(true);
  });

  it('returns true when skills, reviews, or faqs have items', () => {
    expect(hasLandingContent(createMockPath({ landingPage: { skills: ['React'] } }))).toBe(true);
    expect(
      hasLandingContent(
        createMockPath({
          landingPage: {
            reviews: [{ id: '1', name: 'Alice', comment: 'Great path!', rating: 5 }]
          }
        })
      )
    ).toBe(true);
    expect(
      hasLandingContent(
        createMockPath({
          landingPage: {
            faqs: [{ id: '1', question: 'Prerequisites?', answer: 'None' }]
          }
        })
      )
    ).toBe(true);
  });
});

describe('getSetupSteps', () => {
  it('links the price step to /landingpage?section=pricing', () => {
    const path = createMockPath();
    const steps = getSetupSteps(path, '/paths/P1234567');
    const priceStep = steps.find((s) => s.id === 'price');

    expect(priceStep).toBeDefined();
    expect(priceStep?.href).toBe('/paths/P1234567/landingpage?section=pricing');
    expect(priceStep?.isCompleted).toBe(false);
  });

  it('marks price step completed when isPriceConfigured returns true', () => {
    const path = createMockPath({
      landingPage: { paymentEnabled: false }
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const priceStep = steps.find((s) => s.id === 'price');

    expect(priceStep?.isCompleted).toBe(true);
  });

  it('marks order step incomplete when path has no courses', () => {
    const path = createMockPath({ courses: [] });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.isCompleted).toBe(false);
  });

  it('marks order step completed when path has exactly 1 course (trivial order)', () => {
    const path = createMockPath({
      courses: [{ id: 'lpc-1', courseId: 'c-1', order: 1 } as any],
      courseOrderSetAt: null
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.isCompleted).toBe(true);
  });

  it('marks order step incomplete when path has 2+ courses and courseOrderSetAt is null', () => {
    const path = createMockPath({
      courses: [{ id: 'lpc-1', courseId: 'c-1', order: 1 } as any, { id: 'lpc-2', courseId: 'c-2', order: 2 } as any],
      courseOrderSetAt: null
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.isCompleted).toBe(false);
  });

  it('marks order step completed when path has 2+ courses and courseOrderSetAt is set', () => {
    const path = createMockPath({
      courses: [{ id: 'lpc-1', courseId: 'c-1', order: 1 } as any, { id: 'lpc-2', courseId: 'c-2', order: 2 } as any],
      courseOrderSetAt: new Date().toISOString()
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.isCompleted).toBe(true);
  });

  it('links order step to basePath when path has fewer than 2 courses', () => {
    const path = createMockPath({
      courses: [{ id: 'lpc-1', courseId: 'c-1', order: 1 } as any]
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.href).toBe('/paths/P1234567');
  });

  it('links order step to basePath?reorder=true when path has 2+ courses', () => {
    const path = createMockPath({
      courses: [{ id: 'lpc-1', courseId: 'c-1', order: 1 } as any, { id: 'lpc-2', courseId: 'c-2', order: 2 } as any]
    });
    const steps = getSetupSteps(path, '/paths/P1234567');
    const orderStep = steps.find((s) => s.id === 'order');

    expect(orderStep?.href).toBe('/paths/P1234567?reorder=true');
  });
});
