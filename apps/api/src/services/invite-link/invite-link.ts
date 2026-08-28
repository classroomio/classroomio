import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  createInviteLink,
  getInviteLinkByTarget,
  getInviteLinkByTokenHash,
  incrementInviteLinkJoinCount,
  setInviteLinkRevoked,
  toInviteLinkColumns,
  type TInviteLinkTarget
} from '@cio/db/queries/invite-link';
import { createOrganizationMember, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { markUserAndProfileEmailVerified } from '@cio/db/queries/auth/profile';

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

/**
 * One join URL for every resource type. The token alone identifies the resource, so
 * the path never has to change when a new resource type is added.
 */
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
 * Returns the resource's share link, creating it on first request. Idempotent — the
 * same link comes back forever so staff can re-copy it, and a unique constraint keeps
 * it to one per (resource, role).
 *
 * Callers are responsible for authorizing access to `target` (the per-resource routers
 * do this with their existing team-member middleware).
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
// The per-resource routers call these. They resolve the owning organization from the
// resource itself, so a new resource type adds no service code — only a handler entry.

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
  // Resolves first so a bad resource id 404s instead of silently returning null.
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

/**
 * Server-only preview for the join page (API-key protected at the route layer). Never
 * returns the raw token — the caller already holds it.
 */
export async function previewInviteLink(token: string): Promise<InviteLinkPreviewResponse> {
  const tokenHash = hashInviteToken(token);
  const context = await getInviteLinkByTokenHash(db, tokenHash);

  if (!context) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  const handler = getInviteLinkHandler(context.invite.resourceType);

  return {
    invite: { id: context.invite.id, isRevoked: context.invite.isRevoked },
    resource: handler.preview(context),
    organization: context.organization
  };
}

/**
 * Joins the authenticated user to the link's resource.
 *
 * The link is never consumed — it is permanent and reusable, so anyone holding it can
 * join until it is revoked. Joining is idempotent: an existing member simply has their
 * enrollment re-synced.
 *
 * Shared for every resource type: validate the link, confirm the resource is still
 * open, establish org membership (respecting the student cap), record the usage. Only
 * the enrollment step is delegated to the resource handler.
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

  // Committed before the handler runs: the cohort fan-out only assigns profiles that
  // are already members of the org with the granted role.
  const wasAlreadyOrgMember = await db.transaction(async (tx) => {
    const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(organizationId, user.id, tx);

    if (!orgMemberId) {
      await assertStudentCapacityOrThrow(organizationId, 1);

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

    await markUserAndProfileEmailVerified(user.id, tx);
    await incrementInviteLinkJoinCount(tx, inviteId);

    return Boolean(orgMemberId);
  });

  await handler.enroll(inviteContext, user.id, normalizedEmail);

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
