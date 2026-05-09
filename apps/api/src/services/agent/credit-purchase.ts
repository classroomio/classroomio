import { findCreditPurchaseByOrderId, insertCreditPurchaseAndApplyBalance } from '@cio/db/queries/agent';
import type { CreditPurchaseInput } from '@cio/db/queries/agent';
import { AppError } from '@api/utils/errors';

/**
 * Record a Polar token-pack purchase.
 * Idempotent on `providerOrderId` — Polar may retry the webhook.
 */
export async function recordCreditPurchase(input: CreditPurchaseInput) {
  if (input.tokens <= 0) {
    throw new AppError('Tokens must be positive', 'INVALID_CREDIT_AMOUNT', 400);
  }

  const existing = await findCreditPurchaseByOrderId(input.providerOrderId);

  if (existing) {
    return existing;
  }

  return insertCreditPurchaseAndApplyBalance(input);
}
