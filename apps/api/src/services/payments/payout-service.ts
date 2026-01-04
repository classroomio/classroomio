/**
 * Payout Service
 *
 * Handles creating and managing payouts to course creators.
 */

import { db } from '@cio/db/drizzle';
import * as schema from '@cio/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { TPaymentProvider, TPayoutStatus, TPayout, TPaymentAccount } from '@cio/db/types';
import { getProviderByName, getPaymentAccount } from './payment-service';
import type { CreateConnectedAccountInput } from './types';
import { AppError, ErrorCodes } from '@api/utils/errors';

/**
 * Create a connected account for receiving payouts
 */
export async function createPaymentAccount(input: CreateConnectedAccountInput): Promise<TPaymentAccount> {
  const providerName = input.currency === 'NGN' ? 'paystack' : 'stripe';
  const provider = getProviderByName(providerName as TPaymentProvider);

  // Check if account already exists
  const existingAccount = await getPaymentAccount(input.organizationId, providerName as TPaymentProvider);
  if (existingAccount) {
    throw new AppError(
      `A ${providerName} payment account already exists for this organization`,
      ErrorCodes.DUPLICATE_RESOURCE,
      409
    );
  }

  // Create account with the provider
  const result = await provider.createConnectedAccount(input);

  // Store in database
  const [account] = await db
    .insert(schema.paymentAccount)
    .values({
      organizationId: input.organizationId,
      provider: providerName as TPaymentProvider,
      providerAccountId: result.accountId,
      accountName: input.accountName,
      country: input.country,
      currency: input.currency,
      isActive: true,
      isVerified: result.isVerified,
      metadata: result.metadata as Record<string, unknown>
    })
    .returning();

  // If Stripe, return the onboarding URL
  if (result.onboardingUrl) {
    return {
      ...account,
      metadata: {
        ...(account.metadata as Record<string, unknown>),
        onboardingUrl: result.onboardingUrl
      }
    };
  }

  return account;
}

/**
 * Update payment account status (called from webhook)
 */
export async function updatePaymentAccountStatus(
  providerAccountId: string,
  provider: TPaymentProvider,
  updates: {
    isVerified?: boolean;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
  }
): Promise<TPaymentAccount | null> {
  const [account] = await db
    .select()
    .from(schema.paymentAccount)
    .where(
      and(
        eq(schema.paymentAccount.providerAccountId, providerAccountId),
        eq(schema.paymentAccount.provider, provider)
      )
    )
    .limit(1);

  if (!account) {
    return null;
  }

  const [updatedAccount] = await db
    .update(schema.paymentAccount)
    .set({
      isVerified: updates.isVerified ?? account.isVerified,
      isActive: updates.isActive ?? account.isActive,
      metadata: {
        ...(account.metadata as Record<string, unknown>),
        ...updates.metadata
      }
    })
    .where(eq(schema.paymentAccount.id, account.id))
    .returning();

  return updatedAccount;
}

/**
 * Get pending payments for payout (successful payments not yet paid out)
 */
export async function getPendingPaymentsForPayout(
  organizationId: string,
  currency: string
): Promise<Array<{ id: string; amount: number; creatorAmount: number }>> {
  const payments = await db
    .select({
      id: schema.coursePayment.id,
      amount: schema.coursePayment.amount,
      creatorAmount: schema.coursePayment.creatorAmount,
      payoutItemId: schema.payoutItem.id
    })
    .from(schema.coursePayment)
    .leftJoin(schema.payoutItem, eq(schema.coursePayment.id, schema.payoutItem.coursePaymentId))
    .where(
      and(
        eq(schema.coursePayment.organizationId, organizationId),
        eq(schema.coursePayment.currency, currency.toUpperCase()),
        eq(schema.coursePayment.status, 'succeeded')
      )
    );

  // Filter out payments that are already in a payout
  return payments
    .filter((p) => !p.payoutItemId)
    .map((p) => ({
      id: p.id,
      amount: p.amount,
      creatorAmount: p.creatorAmount || 0
    }));
}

/**
 * Create a payout to a creator
 */
export async function createPayout(
  organizationId: string,
  currency: string,
  paymentIds?: string[]
): Promise<TPayout> {
  const providerName = currency === 'NGN' ? 'paystack' : 'stripe';
  const provider = getProviderByName(providerName as TPaymentProvider);

  // Get the payment account
  const paymentAccount = await getPaymentAccount(organizationId, providerName as TPaymentProvider);
  if (!paymentAccount) {
    throw new AppError(
      `No ${providerName} payment account found. Please set up your payment account first.`,
      ErrorCodes.NOT_FOUND,
      404
    );
  }

  if (!paymentAccount.isVerified) {
    throw new AppError(
      'Payment account is not yet verified. Please complete the verification process.',
      ErrorCodes.VALIDATION_ERROR,
      400
    );
  }

  // Get pending payments
  let paymentsToInclude: Array<{ id: string; amount: number; creatorAmount: number }>;

  if (paymentIds && paymentIds.length > 0) {
    // Verify the specified payments are valid
    const allPending = await getPendingPaymentsForPayout(organizationId, currency);
    const pendingIds = new Set(allPending.map((p) => p.id));
    
    const invalidIds = paymentIds.filter((id) => !pendingIds.has(id));
    if (invalidIds.length > 0) {
      throw new AppError(
        `Some payment IDs are invalid or already paid out: ${invalidIds.join(', ')}`,
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    paymentsToInclude = allPending.filter((p) => paymentIds.includes(p.id));
  } else {
    // Include all pending payments for this currency
    paymentsToInclude = await getPendingPaymentsForPayout(organizationId, currency);
  }

  if (paymentsToInclude.length === 0) {
    throw new AppError('No pending payments available for payout', ErrorCodes.VALIDATION_ERROR, 400);
  }

  // Calculate total payout amount
  const totalAmount = paymentsToInclude.reduce((sum, p) => sum + p.creatorAmount, 0);

  // Create payout record
  const [payout] = await db
    .insert(schema.payout)
    .values({
      paymentAccountId: paymentAccount.id,
      organizationId,
      amount: totalAmount,
      currency: currency.toUpperCase(),
      provider: providerName as TPaymentProvider,
      status: 'pending',
      metadata: {
        paymentIds: paymentsToInclude.map((p) => p.id),
        totalPayments: paymentsToInclude.length
      }
    })
    .returning();

  // Create payout items
  await db.insert(schema.payoutItem).values(
    paymentsToInclude.map((p) => ({
      payoutId: payout.id,
      coursePaymentId: p.id,
      amount: p.creatorAmount
    }))
  );

  try {
    // Initiate payout with the provider
    const result = await provider.createPayout(
      {
        paymentAccountId: paymentAccount.id,
        organizationId,
        amount: totalAmount,
        currency: currency.toUpperCase(),
        paymentIds: paymentsToInclude.map((p) => p.id)
      },
      paymentAccount.providerAccountId
    );

    // Update payout with provider ID
    const [updatedPayout] = await db
      .update(schema.payout)
      .set({
        providerPayoutId: result.payoutId,
        status: result.status
      })
      .where(eq(schema.payout.id, payout.id))
      .returning();

    return updatedPayout;
  } catch (error) {
    // Mark payout as failed
    await db
      .update(schema.payout)
      .set({
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      })
      .where(eq(schema.payout.id, payout.id));

    throw error;
  }
}

/**
 * Handle payout status update (called from webhook)
 */
export async function handlePayoutStatusUpdate(
  providerPayoutId: string,
  provider: TPaymentProvider,
  status: TPayoutStatus,
  failureReason?: string
): Promise<TPayout | null> {
  const [payout] = await db
    .select()
    .from(schema.payout)
    .where(
      and(
        eq(schema.payout.providerPayoutId, providerPayoutId),
        eq(schema.payout.provider, provider)
      )
    )
    .limit(1);

  if (!payout) {
    return null;
  }

  const updates: Partial<TPayout> = { status };

  if (status === 'completed') {
    updates.completedAt = new Date().toISOString();
  }

  if (failureReason) {
    updates.failureReason = failureReason;
  }

  const [updatedPayout] = await db
    .update(schema.payout)
    .set(updates)
    .where(eq(schema.payout.id, payout.id))
    .returning();

  return updatedPayout;
}

/**
 * Get payouts for an organization
 */
export async function getPayoutsForOrganization(
  organizationId: string,
  status?: TPayoutStatus
): Promise<TPayout[]> {
  const conditions = [eq(schema.payout.organizationId, organizationId)];

  if (status) {
    conditions.push(eq(schema.payout.status, status));
  }

  return db
    .select()
    .from(schema.payout)
    .where(and(...conditions))
    .orderBy(schema.payout.createdAt);
}

/**
 * Get payout by ID with items
 */
export async function getPayoutWithItems(payoutId: string): Promise<{
  payout: TPayout;
  items: Array<{ id: string; coursePaymentId: string; amount: number }>;
} | null> {
  const [payout] = await db
    .select()
    .from(schema.payout)
    .where(eq(schema.payout.id, payoutId))
    .limit(1);

  if (!payout) {
    return null;
  }

  const items = await db
    .select({
      id: schema.payoutItem.id,
      coursePaymentId: schema.payoutItem.coursePaymentId,
      amount: schema.payoutItem.amount
    })
    .from(schema.payoutItem)
    .where(eq(schema.payoutItem.payoutId, payoutId));

  return { payout, items };
}

/**
 * Generate Stripe Connect onboarding link
 */
export async function getStripeOnboardingLink(
  organizationId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  const paymentAccount = await getPaymentAccount(organizationId, 'stripe');
  
  if (!paymentAccount) {
    throw new AppError(
      'No Stripe payment account found. Please create one first.',
      ErrorCodes.NOT_FOUND,
      404
    );
  }

  const provider = getProviderByName('stripe');
  const result = await provider.createConnectedAccount({
    organizationId,
    accountName: paymentAccount.accountName || 'Creator Account',
    email: '', // Not needed for existing account
    country: paymentAccount.country,
    currency: paymentAccount.currency,
    refreshUrl,
    returnUrl
  });

  return result.onboardingUrl || '';
}
