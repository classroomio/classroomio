import { describe, expect, it } from 'vitest';
import { ZCourseLandingPageUpdateValidated, ZCourseUpdate, ZPaymentLink } from '@cio/utils/validation/course';

describe('ZPaymentLink', () => {
  it('accepts http(s) URLs', () => {
    expect(ZPaymentLink.safeParse('https://pay.example.com/checkout').success).toBe(true);
    expect(ZPaymentLink.safeParse('http://pay.example.com').success).toBe(true);
  });

  it('rejects non-http(s) schemes', () => {
    expect(ZPaymentLink.safeParse('javascript:alert(1)').success).toBe(false);
    expect(ZPaymentLink.safeParse('mailto:pay@example.com').success).toBe(false);
    expect(ZPaymentLink.safeParse('ftp://pay.example.com').success).toBe(false);
  });

  it('rejects relative or malformed links', () => {
    expect(ZPaymentLink.safeParse('stripe.com/pay').success).toBe(false);
    expect(ZPaymentLink.safeParse('').success).toBe(false);
  });
});

describe('ZCourseUpdate paid-course invariants', () => {
  const validPaid = {
    title: 'Course',
    description: 'Desc',
    cost: 50,
    metadata: {
      paymentEnabled: true,
      paymentLink: 'https://pay.example.com/checkout'
    }
  };

  it('accepts a paid course with a positive cost and a valid payment link', () => {
    expect(ZCourseUpdate.safeParse(validPaid).success).toBe(true);
  });

  it('accepts a free course', () => {
    expect(ZCourseUpdate.safeParse({ title: 'Course', description: 'Desc' }).success).toBe(true);
    expect(
      ZCourseUpdate.safeParse({ title: 'Course', description: 'Desc', cost: 0, metadata: { paymentEnabled: false } })
        .success
    ).toBe(true);
  });

  it('rejects a paid course with a zero cost', () => {
    const result = ZCourseUpdate.safeParse({
      ...validPaid,
      cost: 0
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'cost')).toBe(true);
    }
  });

  it('rejects a paid course without a payment link', () => {
    const result = ZCourseUpdate.safeParse({
      ...validPaid,
      metadata: { paymentEnabled: true }
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'metadata.paymentLink')).toBe(true);
    }
  });

  it('rejects a paid course with a non-http(s) payment link', () => {
    expect(
      ZCourseUpdate.safeParse({
        ...validPaid,
        metadata: { paymentEnabled: true, paymentLink: 'javascript:alert(1)' }
      }).success
    ).toBe(false);
  });

  it('treats a cost-only course as paid and requires a payment link', () => {
    expect(ZCourseUpdate.safeParse({ title: 'Course', description: 'Desc', cost: 50 }).success).toBe(false);
  });
});

describe('ZCourseLandingPageUpdateValidated paid-course invariants', () => {
  it('accepts a paid landing-page update with a positive cost and a valid payment link', () => {
    expect(
      ZCourseLandingPageUpdateValidated.safeParse({
        cost: 50,
        metadata: { paymentEnabled: true, paymentLink: 'https://pay.example.com/checkout' }
      }).success
    ).toBe(true);
  });

  it('rejects a paid landing-page update with a zero cost', () => {
    expect(
      ZCourseLandingPageUpdateValidated.safeParse({
        cost: 0,
        metadata: { paymentEnabled: true, paymentLink: 'https://pay.example.com/checkout' }
      }).success
    ).toBe(false);
  });

  it('rejects a paid landing-page update without a valid payment link', () => {
    expect(
      ZCourseLandingPageUpdateValidated.safeParse({
        cost: 50,
        metadata: { paymentEnabled: true, paymentLink: 'not-a-url' }
      }).success
    ).toBe(false);
  });

  it('rejects a paid landing-page update when paymentEnabled is true but cost is missing', () => {
    expect(
      ZCourseLandingPageUpdateValidated.safeParse({
        metadata: { paymentEnabled: true, paymentLink: 'https://pay.example.com/checkout' }
      }).success
    ).toBe(false);
  });
});
