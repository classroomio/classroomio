import * as schema from '@cio/db/schema';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { and, eq } from 'drizzle-orm';
import {
  countInviteDistinctPreviewIps,
  createCourseInvite,
  createCourseInviteAudit,
  getCourseInviteById,
  getCourseInviteByTokenHash,
  listCourseInviteAudit,
  listCourseInviteAuditStats,
  listCourseInvites,
  revokeCourseInvite
} from '@cio/db/queries/course/invite';
import { getCourseById, getCourseWithOrgData, getCourseWithRelations } from '@cio/db/queries/course';

import { ROLE } from '@cio/utils/constants';
import type { TCreateCourseInvite } from '@cio/utils/validation/course/invite';
import crypto from 'node:crypto';
import { db } from '@cio/db/drizzle';
import { env } from '@api/config/env';
import { getCourseTeachers } from '@cio/db/queries/course/people';
import { getProfileById } from '@cio/db/queries/auth';
import { sendEmail } from '@cio/email';

type InviteStatus = 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'REVOKED';
type InvitePreset = 'ONE_TIME_24H' | 'MULTI_USE_7D' | 'MULTI_USE_30D' | 'CUSTOM';

const PRESET_CONFIG: Record<Exclude<InvitePreset, 'CUSTOM'>, { expiresInMs: number; maxUses: number }> = {
  ONE_TIME_24H: { expiresInMs: 24 * 60 * 60 * 1000, maxUses: 1 },
  MULTI_USE_7D: { expiresInMs: 7 * 24 * 60 * 60 * 1000, maxUses: 50 },
  MULTI_USE_30D: { expiresInMs: 30 * 24 * 60 * 60 * 1000, maxUses: 1000 }
};

const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANOMALY_WINDOW_MINUTES = 60;
const MAX_PREVIEW_IP_DIVERSITY = 25;

interface TInviteRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface TAuthUser {
  id: string;
  email?: string | null;
  emailVerified?: boolean | null;
}

function normalizeEmails(emails: string[] | undefined): string[] | null {
  if (!emails || emails.length === 0) {
    return null;
  }

  const normalized = [...new Set(emails.map((email) => email.toLowerCase().trim()).filter(Boolean))];
  return normalized.length > 0 ? normalized : null;
}

function normalizeDomains(domains: string[] | undefined): string[] | null {
  if (!domains || domains.length === 0) {
    return null;
  }

  const normalized = [
    ...new Set(domains.map((domain) => domain.toLowerCase().replace(/^@/, '').trim()).filter(Boolean))
  ];
  if (normalized.some((domain) => !DOMAIN_REGEX.test(domain))) {
    throw new AppError('One or more allowed domains are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'allowedDomains');
  }

  return normalized.length > 0 ? normalized : null;
}

function parseRecipientCsv(recipientCsv: string | undefined): string[] {
  if (!recipientCsv) {
    return [];
  }

  return recipientCsv
    .split(/[\n,;\t ]+/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

function getNormalizedRecipients(
  recipientEmails: string[] | undefined,
  recipientCsv: string | undefined
): {
  valid: string[];
  invalid: string[];
  duplicates: string[];
} {
  const combined = [...(recipientEmails || []), ...parseRecipientCsv(recipientCsv)];
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];

  for (const recipient of combined) {
    const normalized = recipient.toLowerCase().trim();
    if (!normalized) {
      continue;
    }

    if (!EMAIL_REGEX.test(normalized)) {
      invalid.push(normalized);
      continue;
    }

    if (seen.has(normalized)) {
      duplicates.push(normalized);
      continue;
    }

    seen.add(normalized);
    valid.push(normalized);
  }

  return { valid, invalid, duplicates };
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function getInviteStatus(invite: {
  isRevoked: boolean;
  expiresAt: string;
  usedCount: number;
  maxUses: number;
}): InviteStatus {
  if (invite.isRevoked) {
    return 'REVOKED';
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return 'EXPIRED';
  }

  if (invite.usedCount >= invite.maxUses) {
    return 'USED_UP';
  }

  return 'ACTIVE';
}

function getAppBaseUrl(orgSiteName?: string): string {
  if (env.NODE_ENV === 'development') {
    return 'http://localhost:5173';
  }
  const subdomain = orgSiteName && orgSiteName !== 'app' ? orgSiteName : 'app';
  return `https://${subdomain}.classroomio.com`;
}

/**
 * Builds the course enroll URL for invite links (emails, etc.).
 * Uses org subdomain in production.
 */
export function buildEnrollLink(courseSlug: string, token: string, orgSiteName?: string): string {
  const base = getAppBaseUrl(orgSiteName);
  return `${base}/course/${encodeURIComponent(courseSlug)}/enroll?invite_token=${encodeURIComponent(token)}`;
}

function getEmailDomain(email: string): string {
  const [, domain = ''] = email.toLowerCase().split('@');
  return domain;
}

function getExpiryLabel(expiresAtIso: string): string {
  return new Date(expiresAtIso).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC'
  });
}

function resolveInvitePolicy(data: TCreateCourseInvite): { expiresAt: string; maxUses: number } {
  const hasCustomInputs = Boolean(data.expiresAt || data.maxUses);
  const preset = (data.preset || 'MULTI_USE_30D') as InvitePreset;

  if (preset !== 'CUSTOM' && !hasCustomInputs) {
    const config = PRESET_CONFIG[preset as keyof typeof PRESET_CONFIG];
    const expiresAt = new Date(Date.now() + config.expiresInMs).toISOString();
    return {
      expiresAt,
      maxUses: config.maxUses
    };
  }

  const expiresAtMs = data.expiresAt
    ? new Date(data.expiresAt).getTime()
    : Date.now() + PRESET_CONFIG.MULTI_USE_30D.expiresInMs;
  if (Number.isNaN(expiresAtMs)) {
    throw new AppError('Invalid invite expiry date', ErrorCodes.VALIDATION_ERROR, 400, 'expiresAt');
  }
  if (expiresAtMs <= Date.now()) {
    throw new AppError('Invite expiry must be in the future', ErrorCodes.VALIDATION_ERROR, 400, 'expiresAt');
  }

  const maxUses = data.maxUses ?? 1;
  if (maxUses < 1 || maxUses > 1000) {
    throw new AppError('Invite max uses must be between 1 and 1000', ErrorCodes.VALIDATION_ERROR, 400, 'maxUses');
  }

  return {
    expiresAt: new Date(expiresAtMs).toISOString(),
    maxUses
  };
}

function toInviteResponse(
  invite: {
    id: string;
    courseId: string;
    roleId: number;
    expiresAt: string;
    maxUses: number;
    usedCount: number;
    allowedEmails: string[] | null;
    allowedDomains: string[] | null;
    createdAt: string;
    isRevoked: boolean;
  } & {
    inviteLink: string;
  }
) {
  return {
    id: invite.id,
    courseId: invite.courseId,
    roleId: invite.roleId,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    allowedEmails: invite.allowedEmails,
    allowedDomains: invite.allowedDomains,
    createdAt: invite.createdAt,
    inviteLink: invite.inviteLink,
    status: getInviteStatus(invite)
  };
}

async function recordInviteAudit(
  inviteId: string,
  courseId: string,
  eventType: (typeof schema.courseInviteEventType.enumValues)[number],
  context: {
    actorProfileId?: string | null;
    targetEmail?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown>;
  } = {}
) {
  await createCourseInviteAudit({
    inviteId,
    courseId,
    eventType,
    actorProfileId: context.actorProfileId ?? null,
    targetEmail: context.targetEmail ?? null,
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: context.metadata ?? {}
  });
}

async function createSingleInvite(
  courseId: string,
  createdByProfileId: string,
  policy: { expiresAt: string; maxUses: number },
  allowedEmails: string[] | null,
  allowedDomains: string[] | null,
  metadata: Record<string, unknown> | undefined,
  targetEmail: string | null,
  courseSlug: string,
  orgSiteName: string | null
) {
  const token = generateToken();
  const tokenHash = hashToken(token);

  const created = await createCourseInvite({
    courseId,
    roleId: ROLE.STUDENT,
    tokenHash,
    createdByProfileId,
    expiresAt: policy.expiresAt,
    maxUses: policy.maxUses,
    usedCount: 0,
    isRevoked: false,
    allowedEmails,
    allowedDomains,
    metadata: metadata || {}
  });

  await recordInviteAudit(created.id, courseId, 'CREATED', {
    actorProfileId: createdByProfileId,
    targetEmail,
    metadata: {
      maxUses: created.maxUses,
      expiresAt: created.expiresAt
    }
  });

  return {
    ...created,
    inviteLink: buildEnrollLink(courseSlug, token, orgSiteName ?? undefined)
  };
}

async function sendStudentJoinEmails(input: {
  courseId: string;
  courseName: string;
  orgName: string;
  studentId: string;
  studentEmail: string;
}) {
  try {
    await sendEmail('studentCourseWelcome', {
      to: input.studentEmail,
      fields: {
        orgName: input.orgName,
        courseName: input.courseName
      },
      from: `"${input.orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`
    });
  } catch (error) {
    console.error('Failed to send student welcome email:', error);
  }

  try {
    const teachers = await getCourseTeachers({ courseId: input.courseId });
    if (teachers.length === 0) {
      return;
    }

    const studentProfile = await getProfileById(input.studentId);
    const studentName = studentProfile?.fullname || input.studentEmail;

    await Promise.all(
      teachers
        .map((teacher) => teacher.email)
        .filter((email): email is string => !!email)
        .map((teacherEmail) =>
          sendEmail('teacherStudentJoined', {
            to: teacherEmail,
            fields: {
              courseName: input.courseName,
              studentName,
              studentEmail: input.studentEmail
            },
            from: '"ClassroomIO" <notify@mail.classroomio.com>'
          }).catch((error) => {
            console.error(`Failed to send teacher notification email to ${teacherEmail}:`, error);
          })
        )
    );
  } catch (error) {
    console.error('Failed to send teacher join notification emails:', error);
  }
}

async function createEmailInviteAndSend(input: {
  courseId: string;
  createdByProfileId: string;
  recipientEmail: string;
  policy: { expiresAt: string; maxUses: number };
  orgName: string;
  courseName: string;
  courseSlug: string;
  orgSiteName: string | null;
  metadata?: Record<string, unknown>;
  shouldSend: boolean;
}) {
  const createdInvite = await createSingleInvite(
    input.courseId,
    input.createdByProfileId,
    {
      expiresAt: input.policy.expiresAt,
      maxUses: 1
    },
    [input.recipientEmail],
    null,
    {
      ...(input.metadata || {}),
      source: 'DIRECT_EMAIL_INVITE'
    },
    input.recipientEmail,
    input.courseSlug,
    input.orgSiteName
  );

  if (!input.shouldSend) {
    return {
      invite: createdInvite,
      sent: false,
      error: null as string | null
    };
  }

  try {
    const responses = await sendEmail('studentCourseInvite', {
      to: input.recipientEmail,
      fields: {
        orgName: input.orgName,
        courseName: input.courseName,
        inviteLink: createdInvite.inviteLink,
        expiresAt: getExpiryLabel(createdInvite.expiresAt)
      },
      from: `"${input.orgName} (via ClassroomIO.com)" <notify@mail.classroomio.com>`
    });

    const allSuccessful = responses.every((response) => response.success);
    if (!allSuccessful) {
      const errorMessage = responses
        .filter((response) => !response.success)
        .map((response) => response.error || 'Unknown email error')
        .join('; ');

      await recordInviteAudit(createdInvite.id, input.courseId, 'EMAIL_FAILED', {
        actorProfileId: input.createdByProfileId,
        targetEmail: input.recipientEmail,
        metadata: { error: errorMessage }
      });

      return {
        invite: createdInvite,
        sent: false,
        error: errorMessage
      };
    }

    await recordInviteAudit(createdInvite.id, input.courseId, 'EMAIL_SENT', {
      actorProfileId: input.createdByProfileId,
      targetEmail: input.recipientEmail
    });

    return {
      invite: createdInvite,
      sent: true,
      error: null as string | null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    await recordInviteAudit(createdInvite.id, input.courseId, 'EMAIL_FAILED', {
      actorProfileId: input.createdByProfileId,
      targetEmail: input.recipientEmail,
      metadata: { error: message }
    });

    return {
      invite: createdInvite,
      sent: false,
      error: message
    };
  }
}

/**
 * Creates secure student invite tokens for a course.
 * Supports both single-link and direct-email invite creation flows.
 */
export async function createStudentInvite(courseId: string, createdByProfileId: string, data: TCreateCourseInvite) {
  const course = await getCourseById(courseId);
  if (!course?.[0]) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseOrgData = await getCourseWithOrgData(courseId);
  if (!courseOrgData) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const policy = resolveInvitePolicy(data);
  const allowedEmails = normalizeEmails(data.allowedEmails);
  const allowedDomains = normalizeDomains(data.allowedDomains);
  const recipients = getNormalizedRecipients(data.recipientEmails, data.recipientCsv);

  if (recipients.invalid.length > 0) {
    throw new AppError(
      `Invalid recipient emails found: ${recipients.invalid.slice(0, 5).join(', ')}`,
      ErrorCodes.VALIDATION_ERROR,
      400,
      'recipientEmails'
    );
  }

  const courseSlug = course[0].slug;
  const orgSiteName = courseOrgData.orgSiteName ?? null;
  if (!courseSlug) {
    throw new AppError('Course must have a slug to create invite links', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (recipients.valid.length === 0) {
    const createdInvite = await createSingleInvite(
      courseId,
      createdByProfileId,
      policy,
      allowedEmails,
      allowedDomains,
      data.metadata,
      null,
      courseSlug,
      orgSiteName
    );

    return {
      mode: 'single' as const,
      invites: [toInviteResponse(createdInvite)],
      inviteLink: createdInvite.inviteLink,
      duplicatesSkipped: recipients.duplicates,
      delivery: {
        requested: 0,
        sent: 0,
        failed: 0,
        failures: [] as Array<{ email: string; error: string }>
      }
    };
  }

  const orgName = courseOrgData.orgName || 'ClassroomIO';
  const courseName = courseOrgData.courseTitle || course[0].title || 'Course';

  const inviteResults = await Promise.all(
    recipients.valid.map((recipientEmail) =>
      createEmailInviteAndSend({
        courseId,
        createdByProfileId,
        recipientEmail,
        policy,
        orgName,
        courseName,
        courseSlug,
        orgSiteName,
        metadata: data.metadata,
        shouldSend: data.sendEmail
      })
    )
  );

  const sentCount = inviteResults.filter((result) => result.sent).length;
  const failures = inviteResults
    .filter((result) => !result.sent && result.error)
    .map((result) => ({
      email: result.invite.allowedEmails?.[0] || 'unknown',
      error: result.error || 'Failed to send email'
    }));

  return {
    mode: 'bulk' as const,
    invites: inviteResults.map((result) => toInviteResponse(result.invite)),
    inviteLink: inviteResults[0]?.invite.inviteLink || null,
    duplicatesSkipped: recipients.duplicates,
    delivery: {
      requested: recipients.valid.length,
      sent: sentCount,
      failed: recipients.valid.length - sentCount,
      failures
    }
  };
}

/**
 * Unified enrollment: with inviteToken validates and consumes invite; without token enrolls in free course only.
 */
export async function enrollInCourse(
  courseId: string,
  user: TAuthUser,
  body: { inviteToken?: string },
  context: TInviteRequestContext = {}
) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  if (body.inviteToken) {
    return acceptStudentInvite(body.inviteToken, user, context);
  }

  const courseWithRelations = await getCourseWithRelations(courseId);
  if (!courseWithRelations) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const { groupId, cost: courseCost, status, isPublished, title } = courseWithRelations;
  const cost = Number(courseCost ?? 0);
  if (cost > 0) {
    throw new AppError('Paid courses require an invite or payment', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!groupId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const org = courseWithRelations.org;
  if (!org) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (status !== 'ACTIVE' || !isPublished) {
    throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const courseMetadata = (courseWithRelations.metadata as { allowNewStudent?: boolean } | null) ?? null;
  if (courseMetadata?.allowNewStudent === false) {
    throw new AppError('This course is not accepting new students', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  const [existingMember] = await db
    .select({ id: schema.groupmember.id })
    .from(schema.groupmember)
    .where(and(eq(schema.groupmember.groupId, groupId), eq(schema.groupmember.profileId, user.id)))
    .limit(1);

  if (existingMember) {
    return {
      success: true,
      alreadyJoined: true,
      redirectTo: '/lms'
    };
  }

  const [orgMember] = await db
    .select({ id: schema.organizationmember.id })
    .from(schema.organizationmember)
    .where(and(eq(schema.organizationmember.organizationId, org.id), eq(schema.organizationmember.profileId, user.id)))
    .limit(1);

  if (!orgMember) {
    await db.insert(schema.organizationmember).values({
      organizationId: org.id,
      roleId: ROLE.STUDENT,
      profileId: user.id,
      email: normalizedEmail,
      verified: true
    });
  }

  await db.insert(schema.groupmember).values({
    groupId,
    roleId: ROLE.STUDENT,
    profileId: user.id,
    email: normalizedEmail
  });

  await sendStudentJoinEmails({
    courseId,
    courseName: title,
    orgName: org.name,
    studentId: user.id,
    studentEmail: normalizedEmail
  });

  return {
    success: true,
    alreadyJoined: false,
    redirectTo: '/lms'
  };
}

/**
 * Lists secure invites for a course, enriched with activity stats.
 */
export async function listStudentInvites(courseId: string) {
  const [invites, stats] = await Promise.all([listCourseInvites(courseId), listCourseInviteAuditStats(courseId)]);

  const statsByInvite = new Map<
    string,
    {
      previewedCount: number;
      acceptedCount: number;
      emailSentCount: number;
      emailFailedCount: number;
      lastPreviewedAt: string | null;
      lastAcceptedAt: string | null;
      lastEmailSentAt: string | null;
    }
  >();

  for (const row of stats) {
    if (!statsByInvite.has(row.inviteId)) {
      statsByInvite.set(row.inviteId, {
        previewedCount: 0,
        acceptedCount: 0,
        emailSentCount: 0,
        emailFailedCount: 0,
        lastPreviewedAt: null,
        lastAcceptedAt: null,
        lastEmailSentAt: null
      });
    }

    const current = statsByInvite.get(row.inviteId)!;
    if (row.eventType === 'PREVIEWED') {
      current.previewedCount = row.count;
      current.lastPreviewedAt = row.lastAt;
    }
    if (row.eventType === 'ACCEPTED') {
      current.acceptedCount = row.count;
      current.lastAcceptedAt = row.lastAt;
    }
    if (row.eventType === 'EMAIL_SENT') {
      current.emailSentCount = row.count;
      current.lastEmailSentAt = row.lastAt;
    }
    if (row.eventType === 'EMAIL_FAILED') {
      current.emailFailedCount = row.count;
    }
  }

  return invites.map((invite) => {
    const status = getInviteStatus(invite);
    const activity = statsByInvite.get(invite.id) || {
      previewedCount: 0,
      acceptedCount: 0,
      emailSentCount: 0,
      emailFailedCount: 0,
      lastPreviewedAt: null,
      lastAcceptedAt: null,
      lastEmailSentAt: null
    };

    return {
      ...invite,
      status,
      usesRemaining: Math.max(invite.maxUses - invite.usedCount, 0),
      activity
    };
  });
}

export async function getStudentInviteAuditTrail(courseId: string, inviteId: string) {
  const invite = await getCourseInviteById(courseId, inviteId);
  if (!invite) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  return listCourseInviteAudit(courseId, inviteId, 200);
}

/**
 * Revokes an invite for a course.
 */
export async function revokeStudentInvite(courseId: string, inviteId: string, revokedByProfileId: string) {
  const invite = await getCourseInviteById(courseId, inviteId);
  if (!invite) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (invite.isRevoked) {
    return {
      id: invite.id,
      status: getInviteStatus(invite),
      isRevoked: true
    };
  }

  const revoked = await revokeCourseInvite(courseId, inviteId, revokedByProfileId);
  if (!revoked) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  await recordInviteAudit(revoked.id, courseId, 'REVOKED', {
    actorProfileId: revokedByProfileId
  });

  return {
    id: revoked.id,
    status: getInviteStatus(revoked),
    isRevoked: revoked.isRevoked
  };
}

/**
 * Public invite preview by token.
 */
export async function previewStudentInvite(token: string, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);
  const data = await getCourseInviteByTokenHash(tokenHash);

  if (!data) {
    throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
  }

  const sinceIso = new Date(Date.now() - ANOMALY_WINDOW_MINUTES * 60 * 1000).toISOString();
  const ipDiversity = await countInviteDistinctPreviewIps(data.invite.id, sinceIso);

  if (ipDiversity >= MAX_PREVIEW_IP_DIVERSITY) {
    await recordInviteAudit(data.invite.id, data.invite.courseId, 'ABUSE_BLOCKED', {
      targetEmail: null,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        reason: 'preview_ip_diversity',
        uniqueIpCount: ipDiversity
      }
    });

    throw new AppError('Suspicious invite activity detected', ErrorCodes.VALIDATION_ERROR, 429);
  }

  await recordInviteAudit(data.invite.id, data.invite.courseId, 'PREVIEWED', {
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });

  const status = getInviteStatus(data.invite);
  const courseMetadata = data.course.metadata as { allowNewStudent?: boolean } | null;

  return {
    invite: {
      id: data.invite.id,
      roleId: data.invite.roleId,
      expiresAt: data.invite.expiresAt,
      maxUses: data.invite.maxUses,
      usedCount: data.invite.usedCount,
      status,
      requiresEmailMatch: !!(data.invite.allowedEmails?.length || data.invite.allowedDomains?.length)
    },
    organization: {
      ...data.organization,
      theme: data.organization.theme ?? undefined
    },
    course: {
      id: data.course.id,
      title: data.course.title,
      description: data.course.description,
      allowNewStudent: courseMetadata?.allowNewStudent ?? true,
      isPublished: data.course.isPublished,
      status: data.course.status,
      slug: data.course.slug ?? undefined,
      cost: data.course.cost
    }
  };
}

/**
 * Accepts a student invite token and enrolls the user transactionally.
 */
export async function acceptStudentInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();
  const tokenHash = hashToken(token);

  const result = await db.transaction(async (tx) => {
    const [inviteRow] = await tx
      .select({
        invite: schema.courseInvite,
        course: {
          id: schema.course.id,
          title: schema.course.title,
          status: schema.course.status,
          isPublished: schema.course.isPublished,
          metadata: schema.course.metadata,
          groupId: schema.group.id
        },
        organization: {
          id: schema.organization.id,
          name: schema.organization.name,
          siteName: schema.organization.siteName
        }
      })
      .from(schema.courseInvite)
      .innerJoin(schema.course, eq(schema.courseInvite.courseId, schema.course.id))
      .innerJoin(schema.group, eq(schema.course.groupId, schema.group.id))
      .innerJoin(schema.organization, eq(schema.group.organizationId, schema.organization.id))
      .where(eq(schema.courseInvite.tokenHash, tokenHash))
      .limit(1);

    if (!inviteRow) {
      throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
    }

    const { invite, course, organization } = inviteRow;

    const sinceIso = new Date(Date.now() - ANOMALY_WINDOW_MINUTES * 60 * 1000).toISOString();
    const ipDiversity = await countInviteDistinctPreviewIps(invite.id, sinceIso);
    if (ipDiversity >= MAX_PREVIEW_IP_DIVERSITY) {
      await recordInviteAudit(invite.id, invite.courseId, 'ABUSE_BLOCKED', {
        actorProfileId: user.id,
        targetEmail: normalizedEmail,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: {
          reason: 'accept_ip_diversity',
          uniqueIpCount: ipDiversity
        }
      });
      throw new AppError('Suspicious invite activity detected', ErrorCodes.VALIDATION_ERROR, 429);
    }

    // Idempotent behavior: if user is already enrolled, don't consume invite again.
    const [existingMember] = await tx
      .select({
        id: schema.groupmember.id
      })
      .from(schema.groupmember)
      .where(and(eq(schema.groupmember.groupId, course.groupId), eq(schema.groupmember.profileId, user.id)))
      .limit(1);

    if (existingMember) {
      await recordInviteAudit(invite.id, invite.courseId, 'ACCEPTED', {
        actorProfileId: user.id,
        targetEmail: normalizedEmail,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { alreadyJoined: true }
      });

      return {
        alreadyJoined: true,
        courseId: course.id,
        courseName: course.title,
        orgName: organization.name
      };
    }

    const courseMetadata = course.metadata as { allowNewStudent?: boolean } | null;

    if (invite.roleId !== ROLE.STUDENT) {
      throw new AppError('This invite is not valid for student enrollment', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (course.status !== 'ACTIVE' || !course.isPublished) {
      throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
    }

    if (courseMetadata?.allowNewStudent === false) {
      throw new AppError('This course is not accepting new students', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const status = getInviteStatus(invite);
    if (status === 'REVOKED') {
      throw new AppError('This invite has been revoked', ErrorCodes.UNAUTHORIZED, 403);
    }
    if (status === 'EXPIRED') {
      throw new AppError('This invite link has expired', ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (status === 'USED_UP') {
      throw new AppError('This invite has reached its usage limit', ErrorCodes.VALIDATION_ERROR, 400);
    }

    const allowedEmails = invite.allowedEmails?.map((email) => email.toLowerCase()) || [];
    if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
      throw new AppError('This invite is restricted to a different email address', ErrorCodes.UNAUTHORIZED, 403);
    }

    const allowedDomains = invite.allowedDomains?.map((domain) => domain.toLowerCase()) || [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(getEmailDomain(normalizedEmail))) {
      throw new AppError('This invite is restricted to specific email domains', ErrorCodes.UNAUTHORIZED, 403);
    }

    if ((allowedEmails.length > 0 || allowedDomains.length > 0) && user.emailVerified === false) {
      throw new AppError('Please verify your email before accepting this invite', ErrorCodes.UNAUTHORIZED, 403);
    }

    const [orgMember] = await tx
      .select({
        id: schema.organizationmember.id
      })
      .from(schema.organizationmember)
      .where(
        and(
          eq(schema.organizationmember.organizationId, organization.id),
          eq(schema.organizationmember.profileId, user.id)
        )
      )
      .limit(1);

    if (!orgMember) {
      await tx.insert(schema.organizationmember).values({
        organizationId: organization.id,
        roleId: ROLE.STUDENT,
        profileId: user.id,
        email: normalizedEmail,
        verified: true
      });
    }

    await tx.insert(schema.groupmember).values({
      groupId: course.groupId,
      roleId: ROLE.STUDENT,
      profileId: user.id,
      email: normalizedEmail
    });

    const [consumeInvite] = await tx
      .update(schema.courseInvite)
      .set({
        usedCount: invite.usedCount + 1,
        updatedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      })
      .where(and(eq(schema.courseInvite.id, invite.id), eq(schema.courseInvite.usedCount, invite.usedCount)))
      .returning({
        id: schema.courseInvite.id
      });

    if (!consumeInvite) {
      throw new AppError('This invite was already used. Please try another link.', ErrorCodes.VALIDATION_ERROR, 409);
    }

    await recordInviteAudit(invite.id, invite.courseId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyJoined: false }
    });

    return {
      alreadyJoined: false,
      courseId: course.id,
      courseName: course.title,
      orgName: organization.name
    };
  });

  if (!result.alreadyJoined) {
    await sendStudentJoinEmails({
      courseId: result.courseId,
      courseName: result.courseName,
      orgName: result.orgName,
      studentId: user.id,
      studentEmail: normalizedEmail
    });
  }

  return {
    success: true,
    alreadyJoined: result.alreadyJoined,
    redirectTo: '/lms'
  };
}
