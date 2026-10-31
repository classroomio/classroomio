const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Polar's first retry runs 2 days after the initial failed charge, which is the second payment attempt. */
export const PAYMENT_BLOCK_AFTER_DAYS = 2;

export type PaymentStatusPlanLike = {
  isActive: boolean | null;
  paymentFailedAt?: string | null;
};

/**
 * When enrollments pause for a plan whose payment failed, or null when no payment is failing.
 */
export function getPaymentBlockDate(plan?: PaymentStatusPlanLike | null): Date | null {
  if (!plan?.isActive || !plan.paymentFailedAt) {
    return null;
  }

  const failedAt = new Date(plan.paymentFailedAt);

  if (Number.isNaN(failedAt.getTime())) {
    return null;
  }

  return new Date(failedAt.getTime() + PAYMENT_BLOCK_AFTER_DAYS * MS_PER_DAY);
}

/**
 * True once the second payment attempt has failed and the plan has not recovered.
 */
export function isPaymentBlocked(plan?: PaymentStatusPlanLike | null, now: Date = new Date()): boolean {
  const blockDate = getPaymentBlockDate(plan);

  return blockDate !== null && now.getTime() >= blockDate.getTime();
}

/**
 * True while a payment is failing, whether or not enrollments are blocked yet.
 */
export function isPaymentPastDue(plan?: PaymentStatusPlanLike | null): boolean {
  return getPaymentBlockDate(plan) !== null;
}
