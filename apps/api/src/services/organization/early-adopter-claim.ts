import { AppError, ErrorCodes } from '@api/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import {
  buildEarlyAdopterClaimUrl,
  deriveEarlyAdopterClaimToken,
  hashEarlyAdopterClaimToken
} from '@cio/core/services/early-adopter/claim-token';
import { db } from '@cio/db/drizzle';
import { getAccountPrimary } from '@cio/db/queries/account';
import {
  activateOrganizationPlan,
  cancelOrganizationPlan,
  createEarlyAdopterClaim,
  createOrganizationPlan,
  getActiveOrganizationPlan,
  getEarlyAdopterClaimBySubscriptionId,
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationPlanBySubscriptionId,
  lockEarlyAdopterClaimByTokenHash,
  markEarlyAdopterClaimClaimed,
  updateOrganizationPlan,
  updateUnclaimedEarlyAdopterClaim
} from '@cio/db/queries/organization';
import { PLAN } from '@cio/utils/plans';
import type { TEarlyAdopterSubscriptionEvent } from '@cio/utils/validation/organization';

const CLAIM_TTL_MS = 60 * 24 * 60 * 60 * 1000;
const CLAIMABLE_SUBSCRIPTION_STATUSES = ['active', 'trialing'];

export type EarlyAdopterClaimResult = {
  orgId: string;
  planName: typeof PLAN.EARLY_ADOPTER;
};

function isClaimableSubscription(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || !('status' in payload)) return false;

  return CLAIMABLE_SUBSCRIPTION_STATUSES.includes(String(payload.status));
}

async function enqueueClaimEmail(subscriptionId: string, customerEmail: string) {
  const claimUrl = buildEarlyAdopterClaimUrl(deriveEarlyAdopterClaimToken(subscriptionId));
  const { jobIds } = await enqueueTransactionalEmail('earlyAdopterReady', {
    to: customerEmail,
    fields: { claimUrl },
    idempotencyKey: `early-adopter-ready:${subscriptionId}`
  });

  if (jobIds.length === 0) {
    console.error('enqueueClaimEmail error: email was not queued', { subscriptionId });
  }
}

/**
 * Applies a Polar subscription event for a purchase made without an account.
 * Records a new unclaimed purchase and emails the buyer, or keeps an existing claim or plan in sync.
 */
export async function recordEarlyAdopterSubscriptionEvent(data: TEarlyAdopterSubscriptionEvent): Promise<void> {
  try {
    const { event, subscriptionId, payload } = data;
    const claim = await getEarlyAdopterClaimBySubscriptionId(subscriptionId);

    if (claim?.status === 'claimed') {
      if (event === 'activated') await activateOrganizationPlan(subscriptionId, payload);
      if (event === 'updated') await updateOrganizationPlan(subscriptionId, { payload });
      if (event === 'revoked') await cancelOrganizationPlan(subscriptionId, payload);

      return;
    }

    if (claim) {
      const status = event === 'revoked' ? 'canceled' : 'pending';
      await updateUnclaimedEarlyAdopterClaim(subscriptionId, { status, payload });

      return;
    }

    if (event !== 'activated') return;

    const existingPlan = await getOrganizationPlanBySubscriptionId(subscriptionId);

    if (existingPlan) return;

    const tokenHash = hashEarlyAdopterClaimToken(deriveEarlyAdopterClaimToken(subscriptionId));
    const expiresAt = new Date(Date.now() + CLAIM_TTL_MS).toISOString();
    const created = await createEarlyAdopterClaim({
      tokenHash,
      polarSubscriptionId: subscriptionId,
      polarCustomerId: data.customerId ?? null,
      polarCheckoutId: data.checkoutId ?? null,
      email: data.customerEmail,
      expiresAt,
      payload
    });

    if (created) {
      await enqueueClaimEmail(subscriptionId, data.customerEmail);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to record early adopter purchase',
      ErrorCodes.EARLY_ADOPTER_CLAIM_FAILED,
      500
    );
  }
}

/**
 * Connects an unclaimed Early Adopter purchase to the primary organization of `orgId`.
 * Runs in one transaction with the claim row locked. Repeating a successful claim for the same
 * organization returns the same result.
 */
export async function claimEarlyAdopterPlan(
  userId: string,
  orgId: string,
  token: string
): Promise<EarlyAdopterClaimResult> {
  try {
    return await db.transaction(async (tx) => {
      const claim = await lockEarlyAdopterClaimByTokenHash(hashEarlyAdopterClaimToken(token), tx);

      if (!claim) {
        throw new AppError('This link is not valid', ErrorCodes.EARLY_ADOPTER_CLAIM_INVALID, 404);
      }

      const primary = await getAccountPrimary(orgId, tx);

      if (!primary) {
        throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
      }

      if (claim.status === 'claimed') {
        if (claim.claimedOrgId === primary.id) {
          return { orgId: primary.id, planName: PLAN.EARLY_ADOPTER };
        }

        throw new AppError('This link has already been used', ErrorCodes.EARLY_ADOPTER_CLAIM_UNAVAILABLE, 409);
      }

      if (claim.status !== 'pending' || !isClaimableSubscription(claim.payload)) {
        throw new AppError('This plan is no longer active', ErrorCodes.EARLY_ADOPTER_CLAIM_UNAVAILABLE, 409);
      }

      if (new Date(claim.expiresAt).getTime() <= Date.now()) {
        throw new AppError('This link has expired', ErrorCodes.EARLY_ADOPTER_CLAIM_EXPIRED, 410);
      }

      const memberId = await getOrganizationMemberIdByOrgAndProfile(primary.id, userId, tx);

      if (memberId == null) {
        throw new AppError('You are not a member of this organization', ErrorCodes.ORG_TEAM_NOT_AUTHORIZED, 403);
      }

      const activePlan = await getActiveOrganizationPlan(primary.id, tx);

      if (activePlan && activePlan.planName !== PLAN.BASIC) {
        throw new AppError('This organization already has a paid plan', ErrorCodes.EARLY_ADOPTER_PLAN_CONFLICT, 409);
      }

      const existingPlan = await getOrganizationPlanBySubscriptionId(claim.polarSubscriptionId, tx);

      if (!existingPlan) {
        await createOrganizationPlan(
          {
            orgId: primary.id,
            planName: PLAN.EARLY_ADOPTER as 'EARLY_ADOPTER',
            subscriptionId: claim.polarSubscriptionId,
            triggeredBy: memberId,
            payload: claim.payload,
            isActive: true,
            provider: 'polar'
          },
          tx
        );
      }

      const claimed = await markEarlyAdopterClaimClaimed(
        claim.id,
        { claimedOrgId: primary.id, claimedByProfileId: userId },
        tx
      );

      if (!claimed) {
        throw new AppError('This link has already been used', ErrorCodes.EARLY_ADOPTER_CLAIM_UNAVAILABLE, 409);
      }

      return { orgId: primary.id, planName: PLAN.EARLY_ADOPTER };
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to claim early adopter plan',
      ErrorCodes.EARLY_ADOPTER_CLAIM_FAILED,
      500
    );
  }
}
