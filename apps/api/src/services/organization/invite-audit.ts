import { createOrganizationInviteAudit, createOrganizationInviteAudits } from '@cio/db/queries/organization';
import { emitWebhookEvent } from '@cio/core/services/webhook/emit';
import type { TNewOrganizationInviteAudit } from '@db/types';

const ORGANIZATION_INVITE_WEBHOOK_EVENTS: Partial<
  Record<
    TNewOrganizationInviteAudit['eventType'],
    'organization.invite.created' | 'organization.invite.accepted' | 'organization.invite.revoked'
  >
> = {
  CREATED: 'organization.invite.created',
  ACCEPTED: 'organization.invite.accepted',
  REVOKED: 'organization.invite.revoked'
};

export async function recordOrganizationInviteAudit(
  inviteId: string,
  organizationId: string,
  eventType: TNewOrganizationInviteAudit['eventType'],
  context: {
    actorProfileId?: string | null;
    targetEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
) {
  await createOrganizationInviteAudit({
    inviteId,
    organizationId,
    eventType,
    actorProfileId: context.actorProfileId ?? null,
    targetEmail: context.targetEmail ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: context.metadata ?? {}
  });

  const webhookEventType = ORGANIZATION_INVITE_WEBHOOK_EVENTS[eventType];

  if (webhookEventType) {
    await emitWebhookEvent(organizationId, webhookEventType, {
      inviteId,
      email: context.targetEmail ?? null,
      actorProfileId: context.actorProfileId ?? null,
      reason: typeof context.metadata?.reason === 'string' ? context.metadata.reason : null
    });
  }
}

export async function recordOrganizationInviteAudits(rows: TNewOrganizationInviteAudit[]) {
  await createOrganizationInviteAudits(rows);

  for (const row of rows) {
    const webhookEventType = ORGANIZATION_INVITE_WEBHOOK_EVENTS[row.eventType];

    if (!webhookEventType) continue;

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const reason = typeof metadata.reason === 'string' ? metadata.reason : null;

    await emitWebhookEvent(row.organizationId, webhookEventType, {
      inviteId: row.inviteId,
      email: row.targetEmail ?? null,
      actorProfileId: row.actorProfileId ?? null,
      reason
    });
  }
}
