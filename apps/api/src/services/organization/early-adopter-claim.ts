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
  getOrganizationMemberIdByOrgAndProfile,
  getOrganizationMemberRoleId,
  getOrganizationPlanBySubscriptionId,
  lockEarlyAdopterClaimBySubscriptionId,
  lockEarlyAdopterClaimByTokenHash,
  lockOrganizationForPlanClaim,
  markEarlyAdopterClaimClaimed,
  updateOrganizationPlan,
  updateUnclaimedEarlyAdopterClaim
} from '@cio/db/queries/organization';
import { ROLE } from '@cio/utils/constants';
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
    throw new AppError('The claim email was not queued', ErrorCodes.EARLY_ADOPTER_CLAIM_FAILED, 503);
  }
}

/**
 * Applies a Polar subscription event for a purchase made without an account.
 * Records a new unclaimed purchase and emails the buyer, or keeps an existing claim or plan in sync.
 * The claim row is locked while the event is applied, so a revocation cannot be lost to a concurrent claim.
 * The email is queued after commit and a failure throws, so Polar redelivers the activation and the
 * idempotency key keeps the buyer from receiving two links.
 */
export async function recordEarlyAdopterSubscriptionEvent(data: TEarlyAdopterSubscriptionEvent): Promise<void> {
  try {
    const { event, subscriptionId, payload } = data;
    const shouldSendClaimEmail = await db.transaction(async (tx) => {
      const claim = await lockEarlyAdopterClaimBySubscriptionId(subscriptionId, tx);

      if (claim?.status === 'claimed') {
        if (event === 'activated') await activateOrganizationPlan(subscriptionId, payload, tx);
        if (event === 'updated') await updateOrganizationPlan(subscriptionId, { payload }, tx);
        if (event === 'revoked') await cancelOrganizationPlan(subscriptionId, payload, tx);

        return false;
      }

      if (claim) {
        const status = event === 'revoked' ? 'canceled' : 'pending';
        await updateUnclaimedEarlyAdopterClaim(subscriptionId, { status, payload }, tx);

        return event === 'activated';
      }

      if (event !== 'activated') return false;

      const existingPlan = await getOrganizationPlanBySubscriptionId(subscriptionId, tx);

      if (existingPlan) return false;

      const tokenHash = hashEarlyAdopterClaimToken(deriveEarlyAdopterClaimToken(subscriptionId));
      const expiresAt = new Date(Date.now() + CLAIM_TTL_MS).toISOString();
      const created = await createEarlyAdopterClaim(
        {
          tokenHash,
          polarSubscriptionId: subscriptionId,
          polarCustomerId: data.customerId ?? null,
          polarCheckoutId: data.checkoutId ?? null,
          email: data.customerEmail,
          expiresAt,
          payload
        },
        tx
      );

      return Boolean(created);
    });

    if (shouldSendClaimEmail) {
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

      const roleId = await getOrganizationMemberRoleId(primary.id, userId, tx);
      const memberId = await getOrganizationMemberIdByOrgAndProfile(primary.id, userId, tx);

      if (memberId == null || roleId !== ROLE.ADMIN) {
        throw new AppError(
          'Only an admin of this organization can claim a plan',
          ErrorCodes.ORG_TEAM_NOT_AUTHORIZED,
          403
        );
      }

      await lockOrganizationForPlanClaim(primary.id, tx);

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
