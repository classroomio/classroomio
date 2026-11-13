import { refreshOrgHasWebhookEndpoints } from '@cio/core/services/webhook/endpoint-cache';
import { getWebhookUrlPolicy } from '@cio/core/services/webhook/policy';
import { decryptWebhookSecret, encryptWebhookSecret, generateWebhookSecret } from '@cio/core/services/webhook/secret';
import { assertWebhookUrlShape, resolveWebhookTarget, WebhookUrlError } from '@cio/core/services/webhook/url-guard';
import {
  deleteManagedWebhookSubscription,
  upsertManagedWebhookSubscription,
  type TWebhookEndpointWithEvents
} from '@cio/db/queries/webhook';
import type {
  TPublicApiCreateWebhookSubscription,
  TPublicApiWebhookSubscriptionParam
} from '@cio/utils/validation/public-api';

import {
  getConnectedAppKind,
  getSubscriptionHostsForClient,
  getSubscriptionNamePrefix
} from '@api/services/oauth/clients';
import { captureZapierTriggerSubscribed } from '@api/services/product-events';
import { assertWebhooksAllowed } from '@api/services/webhook/webhook';
import { requireOAuthGrant, type TAutomationPrincipal } from '@api/utils/automation-principal';
import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  assertAutomationActor,
  assertCohortBelongsToOrganization,
  assertCourseBelongsToOrganization,
  assertOrgAdmin
} from '../shared';

const SUBSCRIPTION_NAME_MAX_LENGTH = 120;

async function assertTargetUrlAllowed(targetUrl: string, allowedHosts: readonly string[]): Promise<void> {
  const policy = getWebhookUrlPolicy();

  try {
    const parsed = assertWebhookUrlShape(targetUrl, policy);

    if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname)) {
      throw new AppError(
        'targetUrl must be an HTTPS URL on a host registered for this app',
        ErrorCodes.WEBHOOK_URL_INVALID,
        400,
        'targetUrl'
      );
    }

    await resolveWebhookTarget(parsed, policy);
  } catch (error) {
    if (error instanceof WebhookUrlError) {
      throw new AppError(error.message, ErrorCodes.WEBHOOK_URL_INVALID, 400, 'targetUrl');
    }

    throw error;
  }
}

function readSubscriptionSecret(subscription: TWebhookEndpointWithEvents): string {
  if (!subscription.secretCiphertext) {
    throw new AppError('Webhook subscription has no signing secret', ErrorCodes.INTERNAL_ERROR, 500);
  }

  return decryptWebhookSecret(subscription.secretCiphertext);
}

function toWebhookSubscriptionView(subscription: TWebhookEndpointWithEvents) {
  const secret = readSubscriptionSecret(subscription);

  return {
    id: subscription.id,
    eventType: subscription.eventTypes[0],
    targetUrl: subscription.payloadUrl,
    courseId: subscription.filterCourseId,
    cohortId: subscription.filterCohortId,
    secret,
    createdAt: subscription.createdAt
  };
}

/**
 * Subscribes the connected app's `targetUrl` to one event. Idempotent per target URL: a repeat returns the
 * existing subscription with `created: false`, updating its course or cohort filters when they changed.
 * Throws 403 for automation keys or without webhooks.
 */
export async function createWebhookSubscriptionService(
  orgId: string,
  actorId: string | null,
  principal: TAutomationPrincipal,
  payload: TPublicApiCreateWebhookSubscription
) {
  const grant = requireOAuthGrant(principal);
  assertAutomationActor(actorId);
  await assertOrgAdmin(orgId, actorId);
  await assertWebhooksAllowed(orgId);
  await assertTargetUrlAllowed(payload.targetUrl, getSubscriptionHostsForClient(grant.clientId));

  if (payload.courseId) {
    await assertCourseBelongsToOrganization(orgId, payload.courseId);
  }

  if (payload.cohortId) {
    await assertCohortBelongsToOrganization(orgId, payload.cohortId);
  }

  const secret = generateWebhookSecret();
  const secretCiphertext = encryptWebhookSecret(secret);
  const secretLast4 = secret.slice(-4);
  const name = `${getSubscriptionNamePrefix(grant.clientId)} · ${payload.eventType}`.slice(
    0,
    SUBSCRIPTION_NAME_MAX_LENGTH
  );
  const result = await upsertManagedWebhookSubscription(
    {
      organizationId: orgId,
      oauthConsentId: grant.oauthConsentId,
      name,
      payloadUrl: payload.targetUrl,
      secretCiphertext,
      secretLast4,
      filterCourseId: payload.courseId ?? null,
      filterCohortId: payload.cohortId ?? null,
      createdByProfileId: actorId
    },
    payload.eventType
  );

  if (!result.created && result.subscription.eventTypes[0] !== payload.eventType) {
    throw new AppError(
      'targetUrl is already subscribed to a different event',
      ErrorCodes.WEBHOOK_SUBSCRIPTION_CONFLICT,
      409,
      'targetUrl'
    );
  }

  if (result.created || result.reactivated) {
    await refreshOrgHasWebhookEndpoints(orgId);
  }

  if (result.created && getConnectedAppKind(grant.clientId) === 'zapier') {
    captureZapierTriggerSubscribed({ organizationId: orgId, profileId: actorId, eventType: payload.eventType });
  }

  return { subscription: toWebhookSubscriptionView(result.subscription), created: result.created };
}

export async function deleteWebhookSubscriptionService(
  orgId: string,
  principal: TAutomationPrincipal,
  params: TPublicApiWebhookSubscriptionParam
) {
  const grant = requireOAuthGrant(principal);
  const deleted = await deleteManagedWebhookSubscription(grant.oauthConsentId, params.subscriptionId);

  if (!deleted) {
    throw new AppError('Webhook subscription not found', ErrorCodes.WEBHOOK_SUBSCRIPTION_NOT_FOUND, 404);
  }

  await refreshOrgHasWebhookEndpoints(orgId);

  return { id: params.subscriptionId };
}
