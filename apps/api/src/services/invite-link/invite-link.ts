import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createInviteLink,
  getInviteLinkByTarget,
  getInviteLinkByTokenHash,
  incrementInviteLinkJoinCount,
  lockInviteLinkForAccept,
  setInviteLinkRevoked,
  toInviteLinkColumns,
  type TInviteLinkTarget
} from '@cio/db/queries/invite-link';
import { createOrganizationMember, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';

import { ROLE } from '@cio/utils/constants';
import { db } from '@cio/db/drizzle';
import { generateInviteToken, hashInviteToken } from '@api/utils/invite-token';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { assertStudentCapacityOrThrow } from '@api/services/organization/student-limit';
import { getInviteLinkHandler, type InviteLinkPreview } from './handlers';
import type { TInviteLinkResourceType } from '@cio/utils/validation/invite-link';

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
}

export type InviteLinkResponse = {
  id: string;
  token: string;
  inviteLink: string;
  isRevoked: boolean;
  joinCount: number;
  lastUsedAt: string | null;
};

/** One join URL for every resource type; the token identifies the resource. */
export function buildInviteLinkUrl(token: string): string {
  return `${getAppBaseUrl()}/invite/r/${encodeURIComponent(token)}`;
}

function toInviteLinkResponse(invite: {
  id: string;
  token: string;
  isRevoked: boolean;
  joinCount: number;
  lastUsedAt: string | null;
}): InviteLinkResponse {
  return {
    id: invite.id,
    token: invite.token,
    inviteLink: buildInviteLinkUrl(invite.token),
    isRevoked: invite.isRevoked,
    joinCount: invite.joinCount,
    lastUsedAt: invite.lastUsedAt
  };
}

/**
 * Returns the resource's share link, creating it on first request. Idempotent.
 * Callers must authorize `target` themselves — the resource routers do this with
 * their existing team-member middleware.
 */
export async function getOrCreateInviteLink(input: {
  organizationId: string;
  target: TInviteLinkTarget;
  createdByProfileId: string;
  roleId?: number;
}): Promise<InviteLinkResponse> {
  const roleId = input.roleId ?? ROLE.STUDENT;

  const existing = await getInviteLinkByTarget(input.target, roleId);
  if (existing) {
    return toInviteLinkResponse(existing);
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const resourceColumns = toInviteLinkColumns(input.target);

  const created = await createInviteLink({
    organizationId: input.organizationId,
    resourceType: input.target.resourceType,
    ...resourceColumns,
    roleId,
    token,
    tokenHash,
    createdByProfileId: input.createdByProfileId,
    isRevoked: false
  });

  return toInviteLinkResponse(created);
}

/** Returns the resource's share link without creating one. */
export async function fetchInviteLink(
  target: TInviteLinkTarget,
  roleId: number = ROLE.STUDENT
): Promise<InviteLinkResponse | null> {
  const existing = await getInviteLinkByTarget(target, roleId);

  if (!existing) return null;

  return toInviteLinkResponse(existing);
}

/** Disables or re-enables the resource's share link without destroying it. */
export async function toggleInviteLink(input: {
  target: TInviteLinkTarget;
  isRevoked: boolean;
  profileId: string;
  roleId?: number;
}): Promise<InviteLinkResponse> {
  const roleId = input.roleId ?? ROLE.STUDENT;
  const updated = await setInviteLinkRevoked(input.target, roleId, input.isRevoked, input.profileId);

  if (!updated) {
    throw new AppError('Invite link not found', ErrorCodes.NOT_FOUND, 404);
  }

  return toInviteLinkResponse(updated);
}

// ─── Resource-scoped entry points ────────────────────────────────────────────

export async function getOrCreateInviteLinkForResource(
  resourceType: TInviteLinkResourceType,
  resourceId: string,
  createdByProfileId: string
): Promise<InviteLinkResponse> {
  const organizationId = await getInviteLinkHandler(resourceType).resolveOrganizationId(resourceId);

  return getOrCreateInviteLink({
    organizationId,
    target: { resourceType, resourceId },
    createdByProfileId
  });
}

export async function fetchInviteLinkForResource(
  resourceType: TInviteLinkResourceType,
  resourceId: string
): Promise<InviteLinkResponse | null> {
  // Resolves first so a bad resource id 404s instead of returning null.
  await getInviteLinkHandler(resourceType).resolveOrganizationId(resourceId);

  return fetchInviteLink({ resourceType, resourceId });
}

export async function toggleInviteLinkForResource(
  resourceType: TInviteLinkResourceType,
  resourceId: string,
  isRevoked: boolean,
  profileId: string
): Promise<InviteLinkResponse> {
  await getInviteLinkHandler(resourceType).resolveOrganizationId(resourceId);

  return toggleInviteLink({ target: { resourceType, resourceId }, isRevoked, profileId });
}

export type InviteLinkPreviewResponse = {
  invite: { id: string; isRevoked: boolean };
  resource: InviteLinkPreview;
  organization: { id: string; name: string; siteName: string; theme: string | null; avatarUrl: string | null };
};

/** Server-only preview for the join page. Never returns the raw token. */
export async function previewInviteLink(token: string): Promise<InviteLinkPreviewResponse> {
  const tokenHash = hashInviteToken(token);
  const context = await getInviteLinkByTokenHash(db, tokenHash);

  if (!context) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  const handler = getInviteLinkHandler(context.invite.resourceType);

  const { id, name, siteName, theme, avatarUrl } = context.organization;

  return {
    invite: { id: context.invite.id, isRevoked: context.invite.isRevoked },
    resource: handler.preview(context),
    // Picked explicitly so the query's custom-domain fields don't reach the browser.
    organization: { id, name, siteName, theme, avatarUrl }
  };
}

/**
 * Joins the authenticated user to the link's resource. The link is never consumed,
 * and joining is idempotent. Only the enrollment step is delegated to the handler.
 */
export async function acceptInviteLink(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashInviteToken(token);

  const inviteContext = await getInviteLinkByTokenHash(db, tokenHash);

  if (!inviteContext) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  if (inviteContext.invite.isRevoked) {
    throw new AppError('This invite link has been disabled', ErrorCodes.UNAUTHORIZED, 403);
  }

  const handler = getInviteLinkHandler(inviteContext.invite.resourceType);
  const preview = handler.preview(inviteContext);

  if (!preview.isResourceOpen) {
    throw new AppError('This invite is no longer accepting new members', ErrorCodes.VALIDATION_ERROR, 403);
  }

  const organizationId = inviteContext.organization.id;
  const inviteId = inviteContext.invite.id;

  const wasAlreadyOrgMember = await db.transaction(async (tx) => {
    // Re-read under lock: without this a revoke landing mid-request still grants access.
    const locked = await lockInviteLinkForAccept(tx, inviteId);

    if (!locked) {
      throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
    }

    if (locked.isRevoked) {
      throw new AppError('This invite link has been disabled', ErrorCodes.UNAUTHORIZED, 403);
    }

    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(organizationId, user.id, tx);

    if (!orgMemberId) {
      await assertStudentCapacityOrThrow(organizationId, 1);

      // `verified` is membership confirmation, not email ownership.
      await createOrganizationMember(
        {
          organizationId,
          roleId: inviteContext.invite.roleId,
          profileId: user.id,
          email: normalizedEmail,
          verified: true
        },
        tx
      );
    }

    // Unlike email invites, a share link proves nothing about the address, so the
    // email is left unverified and the dashboard's verify-email modal prompts them.

    return Boolean(orgMemberId);
  });

  await handler.enroll(inviteContext, user.id, normalizedEmail);

  // Counted only after enrollment succeeds, so a failed join isn't recorded as one.
  await incrementInviteLinkJoinCount(db, inviteId);

  console.info('acceptInviteLink joined', {
    inviteId,
    resourceType: inviteContext.invite.resourceType,
    profileId: user.id,
    wasAlreadyOrgMember,
    userAgent: context.userAgent ?? null
  });

  return {
    resourceType: preview.resourceType,
    resourceName: preview.resourceName,
    organizationId,
    redirectTo: handler.redirectTo(inviteContext)
  };
}
