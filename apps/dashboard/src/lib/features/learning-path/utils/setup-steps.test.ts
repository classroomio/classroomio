import { describe, expect, it } from 'vitest';
import { isPriceConfigured, getSetupSteps } from './setup-steps';
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
});
