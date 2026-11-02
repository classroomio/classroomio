import { describe, expect, it } from 'vitest';

import { getPaymentBlockDate, isPaymentBlocked, isPaymentPastDue } from '../src/plans/payment-status';

const failedAt = '2026-10-01T12:00:00.000Z';
const dayMs = 24 * 60 * 60 * 1000;

describe('payment status', () => {
  it('has no block date without a failed payment', () => {
    expect(getPaymentBlockDate({ isActive: true, paymentFailedAt: null })).toBeNull();
    expect(getPaymentBlockDate(undefined)).toBeNull();
    expect(isPaymentPastDue({ isActive: true })).toBe(false);
  });

  it('ignores a failed payment on an inactive plan', () => {
    expect(isPaymentPastDue({ isActive: false, paymentFailedAt: failedAt })).toBe(false);
  });

  it('blocks two days after the first failure', () => {
    const plan = { isActive: true, paymentFailedAt: failedAt };
    const failedTime = new Date(failedAt).getTime();

    expect(getPaymentBlockDate(plan)?.getTime()).toBe(failedTime + 2 * dayMs);
    expect(isPaymentPastDue(plan)).toBe(true);
    expect(isPaymentBlocked(plan, new Date(failedTime + dayMs))).toBe(false);
    expect(isPaymentBlocked(plan, new Date(failedTime + 2 * dayMs))).toBe(true);
    expect(isPaymentBlocked(plan, new Date(failedTime + 10 * dayMs))).toBe(true);
  });

  it('treats an unparseable timestamp as not failing', () => {
    expect(isPaymentPastDue({ isActive: true, paymentFailedAt: 'not-a-date' })).toBe(false);
  });
});
