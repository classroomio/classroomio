import { AppError, ErrorCodes } from '@api/utils/errors';
import { and, eq, isNull } from 'drizzle-orm';
import {
  checkEmailsExistInOrg,
  createOrganizationMembers,
  createOrganizationInvite,
  createOrganizationInviteAudit,
  getOrganizationById,
  getOrganizationInviteByTokenHash,
  revokeActiveOrganizationInvitesByEmails
} from '@cio/db/queries/organization';
import { db } from '@cio/db/drizzle';
import { env } from '@api/config/env';
import { sendEmail } from '@cio/email';
import { ROLE } from '@cio/utils/constants';
import * as schema from '@cio/db/schema';
import crypto from 'node:crypto';

type OrganizationInviteStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED';

const ORG_INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
}

function getAppBaseUrl(): string {
  return env.NODE_ENV === 'development' ? 'http://localhost:5173' : 'https://app.classroomio.com';
}

function buildInviteLink(token: string): string {
  return `${getAppBaseUrl()}/invite/t/${encodeURIComponent(token)}`;
}

function getRoleLabel(roleId: number): string {
  if (roleId === ROLE.ADMIN) return 'Admin';
  if (roleId === ROLE.TUTOR) return 'Tutor';
  return `Role ${roleId}`;
}

function getInviteStatus(invite: {
  isRevoked: boolean;
  expiresAt: string;
  acceptedAt: string | null;
}): OrganizationInviteStatus {
  if (invite.isRevoked) {
    return 'REVOKED';
  }

  if (invite.acceptedAt) {
    return 'ACCEPTED';
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
}

function getExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

async function recordOrganizationInviteAudit(
  inviteId: string,
  organizationId: string,
  eventType: (typeof schema.organizationInviteEventType.enumValues)[number],
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
}

/**
 * Creates secure organization role invites from org settings.
 * Invites are role-aware and tokenized; legacy payload links are not used.
 */
export async function inviteTeamMembers(orgId: string, emails: string[], roleId: number, invitedByProfileId: string) {
  if (roleId !== ROLE.ADMIN && roleId !== ROLE.TUTOR) {
    throw new AppError('Invalid organization role for invite', ErrorCodes.VALIDATION_ERROR, 400, 'roleId');
  }

  const organization = await getOrganizationById(orgId);
  if (!organization || !organization.siteName) {
    throw new AppError('Organization not found', ErrorCodes.ORGANIZATION_NOT_FOUND, 404);
  }

  const normalizedEmails = normalizeEmails(emails);
  const existingEmails = await checkEmailsExistInOrg(orgId, normalizedEmails);
  const emailsToInvite = normalizedEmails.filter((email) => !existingEmails.includes(email));

  if (emailsToInvite.length === 0) {
    return [];
  }

  const members = await createOrganizationMembers(
    emailsToInvite.map((email) => ({
      organizationId: orgId,
      email,
      roleId,
      verified: false
    }))
  );

  const revokedInvites = await revokeActiveOrganizationInvitesByEmails(orgId, emailsToInvite, invitedByProfileId);
  await Promise.all(
    revokedInvites.map((invite) =>
      recordOrganizationInviteAudit(invite.id, orgId, 'REVOKED', {
        actorProfileId: invitedByProfileId,
        targetEmail: invite.email,
        metadata: { reason: 'superseded_by_new_invite' }
      })
    )
  );

  const expiresAt = new Date(Date.now() + ORG_INVITE_EXPIRY_MS).toISOString();
  const roleName = getRoleLabel(roleId);

  for (const email of emailsToInvite) {
    try {
      const token = generateToken();
      const tokenHash = hashToken(token);

      const invite = await createOrganizationInvite({
        organizationId: orgId,
        roleId,
        email,
        tokenHash,
        createdByProfileId: invitedByProfileId,
        expiresAt,
        isRevoked: false,
        metadata: {
          source: 'ORG_SETTINGS_TEAM_INVITE'
        }
      });

      await recordOrganizationInviteAudit(invite.id, orgId, 'CREATED', {
        actorProfileId: invitedByProfileId,
        targetEmail: email,
        metadata: {
          roleId,
          roleName,
          expiresAt
        }
      });

      const inviteLink = buildInviteLink(token);

      try {
        const responses = await sendEmail('inviteTeacher', {
          to: email,
          fields: {
            email,
            orgName: organization.name,
            orgSiteName: organization.siteName,
            roleName,
            expiresAt: getExpiryLabel(expiresAt),
            inviteLink
          }
        });

        const allSuccessful = responses.every((response) => response.success);
        if (!allSuccessful) {
          const message = responses
            .filter((response) => !response.success)
            .map((response) => response.error || 'Unknown email error')
            .join('; ');

          await recordOrganizationInviteAudit(invite.id, orgId, 'EMAIL_FAILED', {
            actorProfileId: invitedByProfileId,
            targetEmail: email,
            metadata: { error: message }
          });

          continue;
        }

        await recordOrganizationInviteAudit(invite.id, orgId, 'EMAIL_SENT', {
          actorProfileId: invitedByProfileId,
          targetEmail: email
        });
      } catch (emailError) {
        const message = emailError instanceof Error ? emailError.message : 'Unknown email error';

        await recordOrganizationInviteAudit(invite.id, orgId, 'EMAIL_FAILED', {
          actorProfileId: invitedByProfileId,
          targetEmail: email,
          metadata: { error: message }
        });
      }
    } catch (error) {
      console.error(`Failed to create org invite for ${email}:`, error);
    }
  }

  return members;
}

/**
 * Server-only invite preview by token (API-key protected at route layer).
 */
export async function previewOrganizationInvite(token: string, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);
  const data = await getOrganizationInviteByTokenHash(tokenHash);

  if (!data) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  await recordOrganizationInviteAudit(data.invite.id, data.invite.organizationId, 'PREVIEWED', {
    targetEmail: data.invite.email,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  return {
    invite: {
      id: data.invite.id,
      roleId: data.invite.roleId,
      roleLabel: getRoleLabel(data.invite.roleId),
      email: data.invite.email,
      expiresAt: data.invite.expiresAt,
      status: getInviteStatus(data.invite)
    },
    organization: data.organization
  };
}

/**
 * Authenticated acceptance for organization role invites.
 */
export async function acceptOrganizationInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashToken(token);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        invite: schema.organizationInvite,
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName
        }
      })
      .from(schema.organizationInvite)
      .innerJoin(schema.organization, eq(schema.organizationInvite.organizationId, schema.organization.id))
      .where(eq(schema.organizationInvite.tokenHash, tokenHash))
      .limit(1);

    if (!row) {
      throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
    }

    const status = getInviteStatus(row.invite);
    if (status === 'REVOKED') {
      throw new AppError('This invite has been revoked', ErrorCodes.UNAUTHORIZED, 403);
    }
    if (status === 'EXPIRED') {
      throw new AppError('This invite has expired', ErrorCodes.VALIDATION_ERROR, 400);
    }

    if (row.invite.email.toLowerCase().trim() !== normalizedEmail) {
      throw new AppError('This invite is for a different email address', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (status === 'ACCEPTED') {
      return {
        organization: row.organization,
        roleId: row.invite.roleId,
        alreadyAccepted: true
      };
    }

    const [orgMemberByEmail] = await tx
      .select()
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, row.invite.organizationId),
          eq(schema.organizationmember.email, normalizedEmail)
        )
      )
      .limit(1);

    if (orgMemberByEmail) {
      if (orgMemberByEmail.profileId && orgMemberByEmail.profileId !== user.id) {
        throw new AppError('This invite is linked to another account', ErrorCodes.UNAUTHORIZED, 403);
      }

      await tx
        .update(schema.organizationmember)
        .set({
          profileId: user.id,
          roleId: row.invite.roleId,
          email: normalizedEmail,
          verified: true
        })
        .where(eq(schema.organizationmember.id, orgMemberByEmail.id));
    } else {
      const [orgMemberByProfile] = await tx
        .select()
        .from(schema.organizationmember)
        .where(
          and(
            eq(schema.organizationmember.organizationId, row.invite.organizationId),
            eq(schema.organizationmember.profileId, user.id)
          )
        )
        .limit(1);

      if (orgMemberByProfile) {
        await tx
          .update(schema.organizationmember)
          .set({
            roleId: row.invite.roleId,
            email: normalizedEmail,
            verified: true
          })
          .where(eq(schema.organizationmember.id, orgMemberByProfile.id));
      } else {
        await tx.insert(schema.organizationmember).values({
          organizationId: row.invite.organizationId,
          roleId: row.invite.roleId,
          profileId: user.id,
          email: normalizedEmail,
          verified: true
        });
      }
    }

    const [acceptedInvite] = await tx
      .update(schema.organizationInvite)
      .set({
        acceptedAt: new Date().toISOString(),
        acceptedByProfileId: user.id,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(schema.organizationInvite.id, row.invite.id),
          eq(schema.organizationInvite.isRevoked, false),
          isNull(schema.organizationInvite.acceptedAt)
        )
      )
      .returning({
        id: schema.organizationInvite.id
      });

    if (!acceptedInvite) {
      throw new AppError('Invite is no longer available', ErrorCodes.VALIDATION_ERROR, 409);
    }

    return {
      organization: row.organization,
      roleId: row.invite.roleId,
      alreadyAccepted: false
    };
  });

  const siteName = result.organization.siteName || '';

  const invite = await getOrganizationInviteByTokenHash(tokenHash);
  if (invite) {
    await recordOrganizationInviteAudit(invite.invite.id, invite.invite.organizationId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyAccepted: result.alreadyAccepted }
    });
  }

  return {
    organizationId: result.organization.id,
    roleId: result.roleId,
    alreadyAccepted: result.alreadyAccepted,
    redirectTo: siteName ? `/org/${siteName}` : '/org'
  };
}
