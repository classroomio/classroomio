import {
  countInviteDistinctPreviewIps,
  createCourseInvite,
  createCourseInviteAudit,
  getCourseInviteById,
  getCourseInviteByTokenHash,
  getPaginatedCourseInvites,
  listCourseInviteAudit,
  listCourseInviteAuditStats,
  listCourseInviteAuditStatsForInvites,
  listCourseInvites,
  optimisticIncrementCourseInviteUsedCount,
  revokeCourseInvite,
  revokeLiveEmailBoundCourseInvitesForCourse,
  selectCourseInviteAcceptBundleByInviteId,
  selectCourseInviteAcceptBundleByTokenHash
} from '@cio/db/queries/course/invite';
import type { TCourseInviteAcceptBundle, TCourseInviteListItem } from '@cio/db/queries/course/invite';
import {
  getOrganizationMemberIdByOrgAndProfile,
  listLiveStudentOrgInvitesForEmail,
  selectOrganizationInviteWithOrgByInviteId
} from '@cio/db/queries/organization';
import { parseCourseIdsFromInviteMetadata } from '@cio/utils/functions/invite-metadata';
import { addGroupMember, getGroupMemberIdByGroupAndProfile } from '@cio/db/queries/group';
import {
  getCourseById,
  getCourseWithOrgData,
  getCourseWithRelations,
  getOrgIdByCourseId,
  isCourseSlugTaken,
  updateCourseSlug
} from '@cio/db/queries/course';
import { importAudienceMembers, revokeAudienceInviteAccess } from '@api/services/organization/audience';
import {
  bindProfileInOrg,
  buildFulfilledSummary,
  runBindingSideEffects
} from '@api/services/organization/invite-binding';
import { enrollOrganizationInviteUserCore } from '@cio/core/services/organization/invite-enrollment';
import { STUDENT_HOME_ENTRY_PATH } from '@cio/utils/lms';
import type { AudienceImportRowResult } from '@cio/utils/validation/organization';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { isSelfEnrollmentAllowed } from '@cio/utils/functions';
import { ROLE } from '@cio/utils/constants';
import { isCoursePaid } from '@cio/utils/validation/course';
import type { TCreateCourseInvite } from '@cio/utils/validation/course/invite';
import type { TCourseInvite, TNewCourseInvite, TNewCourseInviteAudit } from '@db/types';
import crypto from 'node:crypto';
import { getDashboardBaseUrl } from '@cio/core/config/dashboard-url';
import { invalidateOrgStats } from '@cio/core/utils/redis/org-stats-cache';
import {
  buildMemberSource,
  emitCourseMemberAddedWebhookEvent,
  emitCourseWebhookEvent
} from '@cio/core/services/webhook/emit';
import { getCourseTeachers } from '@cio/db/queries/course/people';
import { getProfileById } from '@cio/db/queries/auth';
import { buildEmailFromName, buildEmailBranding, type EmailBranding } from '@cio/email';
import { enqueueTransactionalEmail } from '@api/services/jobs';
import { getProfileByEmail, markUserAndProfileEmailVerified } from '@cio/db/queries/auth';
import { generateSlug } from '@cio/utils/functions';
import { emitComplianceEnrollmentEvents, ensureComplianceEnrollmentRecordsForProfiles } from './compliance';
import { getWelcomeSessionIcs } from './session-invite';
import { db, type DbOrTxClient } from '@cio/db/drizzle';
import { trackServerEvent, SERVER_EVENTS } from '@cio/tracking';
import type { TEventSource } from '@cio/core/services/posthog';
import { captureLearnerInvited, captureLearnersEnrolled } from '@api/services/product-events';

/**
 * Minimal org-url bundle threaded through invite/email paths so every URL
 * we generate respects the org's verified custom domain.
 */
type OrgUrlInfo = {
  siteName: string | null;
  customDomain: string | null;
  isCustomDomainVerified: boolean | null;
};

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

async function generateUniqueCourseSlug(baseSlug: string): Promise<string> {
  let suffix = 0;
  let candidate = baseSlug;

  while (true) {
    const taken = await isCourseSlugTaken(candidate);

    if (!taken) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

async function ensureCourseSlug(courseId: string, title: string | null | undefined): Promise<string> {
  const baseSlug = generateSlug(title, { fallback: 'course' });
  const uniqueSlug = await generateUniqueCourseSlug(baseSlug);

  const updated = await updateCourseSlug(courseId, uniqueSlug);

  return updated?.slug ?? uniqueSlug;
}

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

/**
 * Builds the course enroll URL for invite links (emails, etc.). Respects the
 * org's verified custom domain when present, otherwise falls back to the
 * tenant subdomain.
 */
export function buildEnrollLink(courseSlug: string, token: string, org?: OrgUrlInfo | null): string {
  const base = getDashboardBaseUrl(org ?? undefined);
  return `${base}/course/${encodeURIComponent(courseSlug)}/enroll?invite_token=${encodeURIComponent(token)}`;
}

function getEmailDomain(email: string): string {
  const [, domain = ''] = email.toLowerCase().split('@');
  return domain;
}

function isEmailAllowedByInvite(
  invite: { allowedEmails: string[] | null; allowedDomains: string[] | null },
  email: string
) {
  const normalizedEmail = email.toLowerCase().trim();
  const allowedEmails = invite.allowedEmails?.map((allowed) => allowed.toLowerCase()) ?? [];
  const allowedDomains = invite.allowedDomains?.map((domain) => domain.toLowerCase()) ?? [];

  if (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail)) {
    return false;
  }

  return allowedDomains.length === 0 || allowedDomains.includes(getEmailDomain(normalizedEmail));
}

/**
 * True when the token is an active course invite of the organization and its email restrictions admit the email.
 * Never throws; lookup failures count as not allowed.
 */
export async function canSignUpWithCourseInvite(organizationId: string, token: string, email: string) {
  try {
    const data = await getCourseInviteByTokenHash(hashToken(token));

    if (!data || data.organization.id !== organizationId) {
      return false;
    }

    if (getInviteStatus(data.invite) !== 'ACTIVE') {
      return false;
    }

    return isEmailAllowedByInvite(data.invite, email);
  } catch (error) {
    console.error('canSignUpWithCourseInvite error:', error);
    return false;
  }
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

const COURSE_INVITE_WEBHOOK_EVENTS: Partial<
  Record<
    TNewCourseInviteAudit['eventType'],
    'course.invite.created' | 'course.invite.accepted' | 'course.invite.revoked'
  >
> = {
  CREATED: 'course.invite.created',
  ACCEPTED: 'course.invite.accepted',
  REVOKED: 'course.invite.revoked'
};

type TInviteAuditContext = {
  actorProfileId?: string | null;
  targetEmail?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  deferWebhook?: boolean;
};

async function emitInviteWebhook(
  inviteId: string,
  courseId: string,
  eventType: TNewCourseInviteAudit['eventType'],
  context: Pick<TInviteAuditContext, 'actorProfileId' | 'targetEmail'>
) {
  const webhookEventType = COURSE_INVITE_WEBHOOK_EVENTS[eventType];

  if (!webhookEventType) return;

  await emitCourseWebhookEvent(courseId, webhookEventType, {
    inviteId,
    inviteLinkId: null,
    email: context.targetEmail ?? null,
    actorProfileId: context.actorProfileId ?? null
  });
}

async function recordInviteAudit(
  inviteId: string,
  courseId: string,
  eventType: TNewCourseInviteAudit['eventType'],
  context: TInviteAuditContext = {}
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

  if (context.deferWebhook) return;

  await emitInviteWebhook(inviteId, courseId, eventType, context);
}

function newStudentInvite(
  courseId: string,
  createdByProfileId: string,
  policy: { expiresAt: string; maxUses: number },
  allowedEmails: string[] | null,
  allowedDomains: string[] | null,
  metadata: Record<string, unknown> | undefined
): { token: string; values: TNewCourseInvite } {
  const token = generateToken();
  const values: TNewCourseInvite = {
    courseId,
    roleId: ROLE.STUDENT,
    tokenHash: hashToken(token),
    createdByProfileId,
    expiresAt: policy.expiresAt,
    maxUses: policy.maxUses,
    usedCount: 0,
    isRevoked: false,
    allowedEmails,
    allowedDomains,
    metadata: metadata || {}
  };

  return { token, values };
}

async function recordCreatedInvite(
  created: TCourseInvite,
  token: string,
  createdByProfileId: string,
  targetEmail: string | null,
  courseSlug: string,
  org: OrgUrlInfo
): Promise<TCourseInviteWithLink> {
  await recordInviteAudit(created.id, created.courseId, 'CREATED', {
    actorProfileId: createdByProfileId,
    targetEmail,
    metadata: {
      maxUses: created.maxUses,
      expiresAt: created.expiresAt
    }
  });

  return {
    ...created,
    inviteLink: buildEnrollLink(courseSlug, token, org)
  };
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
  org: OrgUrlInfo
) {
  const { token, values } = newStudentInvite(
    courseId,
    createdByProfileId,
    policy,
    allowedEmails,
    allowedDomains,
    metadata
  );
  const created = await createCourseInvite(values);

  return recordCreatedInvite(created, token, createdByProfileId, targetEmail, courseSlug, org);
}

async function sendStudentJoinEmails(input: {
  courseId: string;
  courseName: string;
  orgName: string;
  organizationId: string;
  org: OrgUrlInfo;
  branding: EmailBranding;
  studentId: string;
  studentEmail: string;
  welcomeEmailMessage?: string | null;
}) {
  try {
    const loginUrl = getDashboardBaseUrl(input.org);
    const ics = await getWelcomeSessionIcs(input.courseId);
    await enqueueTransactionalEmail('studentCourseWelcome', {
      to: input.studentEmail,
      fields: {
        orgName: input.orgName,
        courseName: input.courseName,
        loginUrl,
        customMessage: input.welcomeEmailMessage ?? undefined,
        branding: input.branding
      },
      from: buildEmailFromName(`${input.orgName} (via ClassroomIO.com)`),
      idempotencyKey: `course-welcome:${input.courseId}:${input.studentId}`,
      ics,
      preference: { organizationId: input.organizationId, recipientProfileId: input.studentId }
    });
  } catch (error) {
    console.error('Failed to enqueue student welcome email:', error);
  }

  try {
    const teachers = await getCourseTeachers({ courseId: input.courseId });
    if (teachers.length === 0) {
      return;
    }

    const studentProfile = await getProfileById(input.studentId);
    const studentName = studentProfile?.fullname || input.studentEmail;

    const teacherEmails = teachers.map((teacher) => teacher.email).filter((email): email is string => !!email);

    if (teacherEmails.length === 0) return;

    await enqueueTransactionalEmail('teacherStudentJoined', {
      to: teacherEmails,
      fields: {
        courseName: input.courseName,
        studentName,
        studentEmail: input.studentEmail,
        branding: input.branding
      },
      from: buildEmailFromName('ClassroomIO'),
      idempotencyKey: `teacher-student-joined:${input.courseId}:${input.studentId}`,
      preference: { organizationId: input.organizationId }
    });
  } catch (error) {
    console.error('Failed to enqueue teacher join notification emails:', error);
  }
}

export type TCourseInviteContext = {
  organizationId: string;
  orgName: string;
  courseName: string;
  courseSlug: string;
  org: OrgUrlInfo;
  branding: EmailBranding;
};

/**
 * Resolves the course, organization and branding values every course-invite path needs.
 */
export async function resolveCourseInviteContext(courseId: string): Promise<TCourseInviteContext> {
  const course = await getCourseById(courseId);
  if (!course?.[0]) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseOrgData = await getCourseWithOrgData(courseId);
  if (!courseOrgData) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseTitle = course[0].title;
  const courseSlug = course[0].slug ?? (await ensureCourseSlug(course[0].id, courseTitle));
  const branding = buildEmailBranding({
    name: courseOrgData.orgName,
    avatarUrl: courseOrgData.orgAvatarUrl,
    theme: courseOrgData.orgTheme
  });

  return {
    organizationId: courseOrgData.orgId,
    orgName: courseOrgData.orgName || 'ClassroomIO',
    courseName: courseOrgData.courseTitle || courseTitle || 'Course',
    courseSlug,
    org: {
      siteName: courseOrgData.orgSiteName ?? null,
      customDomain: courseOrgData.orgCustomDomain ?? null,
      isCustomDomainVerified: courseOrgData.orgIsCustomDomainVerified ?? null
    },
    branding
  };
}

type TCourseInviteWithLink = TCourseInvite & { inviteLink: string };

export type TCourseEmailInviteStatus =
  | 'invited'
  | 'already_invited'
  | 'enrolled'
  | 'already_enrolled'
  | 'is_staff'
  | 'archived'
  | 'over_seat_limit'
  | 'invalid_email'
  | 'duplicate';

export type TCourseEmailInviteRecipient = {
  email: string;
  status: TCourseEmailInviteStatus;
  inviteId: string | null;
  inviteKind: 'organization' | null;
  inviteLink: string | null;
};

export type TCourseEmailInviteResult = {
  recipients: TCourseEmailInviteRecipient[];
  emailsSent: number;
  emailsFailed: number;
  emailFailures: { email: string; error: string }[];
};

export type TCourseEmailInviteOptions = {
  sendEmail: boolean;
  reissue: 'always' | 'when-changed';
  includeInviteLinks?: boolean;
  source?: TEventSource;
  inviteSource: string;
};

function toCourseEmailInviteStatus(row: AudienceImportRowResult): TCourseEmailInviteStatus {
  switch (row.status) {
    case 'ready':
    case 'invite_resent':
      return 'invited';
    case 'already_invited':
      return 'already_invited';
    case 'already_member':
      return row.enrollment === 'enrolled' ? 'enrolled' : 'already_enrolled';
    case 'is_staff':
    case 'archived':
    case 'over_seat_limit':
      return row.status;
    case 'duplicate_in_file':
      return 'duplicate';
    default:
      return 'invalid_email';
  }
}

/**
 * Invites students to a course by email. Every recipient who has not joined gets the course added to their single
 * organization invite (new emails become pending members and take a seat); students who already joined are enrolled
 * directly. No course invite rows are created.
 */
export async function inviteStudentsToCourseByEmail(
  courseId: string,
  actorProfileId: string,
  emails: string[],
  options: TCourseEmailInviteOptions
): Promise<TCourseEmailInviteResult> {
  const orgId = await getOrgIdByCourseId(courseId);
  if (!orgId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const result = await importAudienceMembers(
    orgId,
    {
      recipients: emails.map((email) => ({ email })),
      courseIds: [courseId],
      allCourses: false,
      allCohorts: false,
      sendEmail: options.sendEmail
    },
    actorProfileId,
    options.source ?? 'dashboard',
    { reissue: options.reissue, includeInviteLinks: options.includeInviteLinks, inviteSource: options.inviteSource }
  );

  const recipients = result.rows.map((row) => ({
    email: row.email,
    status: toCourseEmailInviteStatus(row),
    inviteId: row.inviteId ?? null,
    inviteKind: row.inviteId ? ('organization' as const) : null,
    inviteLink: row.inviteLink ?? null
  }));

  return {
    recipients,
    emailsSent: result.emailsSent,
    emailsFailed: result.emailsFailed,
    emailFailures: result.emailFailures
  };
}

/**
 * Creates a shareable course invite link when no recipients are given; otherwise invites each recipient through their
 * organization invite (see `inviteStudentsToCourseByEmail`) and reports a status per recipient.
 */
export async function createStudentInvite(
  courseId: string,
  createdByProfileId: string,
  data: TCreateCourseInvite,
  source: TEventSource = 'dashboard'
) {
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

  const context = await resolveCourseInviteContext(courseId);

  if (recipients.valid.length === 0) {
    const createdInvite = await createSingleInvite(
      courseId,
      createdByProfileId,
      policy,
      allowedEmails,
      allowedDomains,
      data.metadata,
      null,
      context.courseSlug,
      context.org
    );

    captureLearnerInvited({
      profileId: createdByProfileId,
      orgId: context.organizationId,
      target: 'course',
      inviteType: 'link',
      count: 1,
      courseId,
      source
    });

    return {
      mode: 'single' as const,
      invites: [toInviteResponse(createdInvite)],
      inviteLink: createdInvite.inviteLink as string | null,
      recipients: [] as TCourseEmailInviteRecipient[],
      duplicatesSkipped: recipients.duplicates,
      delivery: {
        requested: 0,
        sent: 0,
        failed: 0,
        failures: [] as Array<{ email: string; error: string }>
      }
    };
  }

  const invited = await inviteStudentsToCourseByEmail(courseId, createdByProfileId, recipients.valid, {
    sendEmail: data.sendEmail,
    reissue: 'always',
    includeInviteLinks: true,
    source,
    inviteSource: 'COURSE_INVITE'
  });

  return {
    mode: 'bulk' as const,
    invites: [] as ReturnType<typeof toInviteResponse>[],
    inviteLink: null,
    recipients: invited.recipients,
    duplicatesSkipped: recipients.duplicates,
    delivery: {
      requested: data.sendEmail ? recipients.valid.length : 0,
      sent: invited.emailsSent,
      failed: invited.emailsFailed,
      failures: invited.emailFailures
    }
  };
}

const RESEND_REFUSALS: Partial<Record<TCourseEmailInviteStatus, () => AppError>> = {
  already_enrolled: () =>
    new AppError('This student already joined the course', ErrorCodes.COURSE_MEMBER_EXISTS, 409, 'email'),
  is_staff: () => new AppError('This email belongs to an admin or tutor', ErrorCodes.STAFF_CANNOT_ENROLL, 409, 'email'),
  archived: () =>
    new AppError('This email belongs to an archived organization member', ErrorCodes.ORG_MEMBER_ARCHIVED, 409, 'email'),
  over_seat_limit: () => new AppError('Your plan has no student seats left', ErrorCodes.UPGRADE_REQUIRED, 403),
  invalid_email: () => new AppError('An email address is required', ErrorCodes.VALIDATION_ERROR, 400, 'email')
};

/**
 * Sends `email` a fresh link to their organization invite with this course on it, and retires any older
 * single-recipient course invite for the same course and email so its link reports that it was replaced.
 */
export async function resendCourseInvitation(
  courseId: string,
  createdByProfileId: string,
  email: string,
  sendEmail = true
): Promise<TCourseEmailInviteRecipient> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw RESEND_REFUSALS.invalid_email!();
  }

  const { recipients } = await inviteStudentsToCourseByEmail(courseId, createdByProfileId, [normalizedEmail], {
    sendEmail,
    reissue: 'always',
    inviteSource: 'COURSE_RESEND'
  });
  const [recipient] = recipients;
  const refusal = recipient ? RESEND_REFUSALS[recipient.status] : RESEND_REFUSALS.invalid_email;
  if (refusal) throw refusal();

  if (recipient.inviteId) {
    const retired = await revokeLiveEmailBoundCourseInvitesForCourse(
      courseId,
      normalizedEmail,
      createdByProfileId,
      recipient.inviteId
    );

    for (const legacyInvite of retired) {
      await recordInviteAudit(legacyInvite.id, courseId, 'REVOKED', {
        actorProfileId: createdByProfileId,
        targetEmail: normalizedEmail,
        metadata: { reason: 'superseded', supersededBy: recipient.inviteId }
      });
    }
  }

  return recipient;
}

/**
 * Unified enrollment: with inviteToken validates and consumes invite; without token enrolls in free course only.
 *
 * Self-enrollment also requires the course to accept new students, and when the
 * org sets `internalEnrollmentOnly`, the user must already be an org member.
 * Invites bypass both checks — they are how non-members are let in.
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

  const { groupId, cost: courseCost, status, isPublished, isPrivate, title } = courseWithRelations;
  const isPaidCourse = isCoursePaid(
    courseCost,
    courseWithRelations.metadata as { paymentEnabled?: boolean; paymentLink?: string | null } | null | undefined
  );
  if (isPaidCourse) {
    throw new AppError('Paid courses require an invite or payment', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!groupId) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const org = courseWithRelations.org;
  if (!org) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  if (status !== 'ACTIVE' || !isPublished || isPrivate) {
    throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const courseMetadata =
    (courseWithRelations.metadata as {
      allowSelfEnrollment?: boolean;
      allowNewStudent?: boolean;
      welcomeEmailMessage?: string | null;
    } | null) ?? null;
  const isInternalEnrollmentOnly = org.settings?.internalEnrollmentOnly ?? false;

  const orgMemberId = await getOrganizationMemberIdByOrgAndProfile(org.id, user.id);

  if (!isSelfEnrollmentAllowed(courseMetadata)) {
    throw new AppError('This course is not accepting new students', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (isInternalEnrollmentOnly && !orgMemberId) {
    throw new AppError(
      'This organization only allows its members to enroll. Ask an admin for an invitation.',
      ErrorCodes.FORBIDDEN,
      403
    );
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  const existingMemberId = await getGroupMemberIdByGroupAndProfile(groupId, user.id);

  if (existingMemberId) {
    await ensureComplianceEnrollmentRecordsForProfiles([courseId], [user.id]);

    return {
      success: true,
      alreadyJoined: true,
      redirectTo: `/courses/${courseId}/lessons?next=true`,
      fulfilled: { courses: [], cohorts: [] }
    };
  }

  const { bindResult, selfEnrolledMember } = await db.transaction(async (tx) => {
    const bindResult = await bindProfileInOrg(tx, {
      orgId: org.id,
      profileId: user.id,
      email: normalizedEmail,
      trigger: 'self-enroll',
      identityProven: user.emailVerified === true,
      roleForNewMember: ROLE.STUDENT
    });

    const [member] = await addGroupMember(
      {
        groupId,
        roleId: ROLE.STUDENT,
        profileId: user.id,
        email: normalizedEmail
      },
      tx
    );

    return { bindResult, selfEnrolledMember: member ?? null };
  });

  await runBindingSideEffects(bindResult, {
    orgId: org.id,
    profileId: user.id,
    email: normalizedEmail,
    trigger: 'self-enroll',
    context
  });

  if (selfEnrolledMember) {
    await emitCourseMemberAddedWebhookEvent(courseId, selfEnrolledMember, {
      source: buildMemberSource('self_enroll'),
      actorProfileId: user.id
    });
  }

  await invalidateOrgStats(org.id);

  const { createdRecords } = await ensureComplianceEnrollmentRecordsForProfiles([courseId], [user.id]);
  await emitComplianceEnrollmentEvents(createdRecords);

  const fulfilled = await buildFulfilledSummary(org.id, bindResult, [courseId]);

  await sendStudentJoinEmails({
    courseId,
    courseName: title,
    orgName: org.name,
    organizationId: org.id,
    org: { siteName: org.siteName, customDomain: org.customDomain, isCustomDomainVerified: org.isCustomDomainVerified },
    branding: buildEmailBranding({ name: org.name, avatarUrl: org.avatarUrl, theme: org.theme }),
    studentId: user.id,
    studentEmail: normalizedEmail,
    welcomeEmailMessage: courseMetadata?.welcomeEmailMessage
  });

  trackServerEvent({
    eventType: SERVER_EVENTS.ENROLLMENT_COMPLETED,
    orgId: org.id,
    userId: user.id,
    courseId,
    props: { path: 'free-enrollment' }
  });

  captureLearnersEnrolled([{ groupId, profileId: user.id, roleId: ROLE.STUDENT }], 'self');

  const redirectTo = fulfilled.courses.length > 0 ? STUDENT_HOME_ENTRY_PATH : `/courses/${courseId}/lessons?next=true`;

  return {
    success: true,
    alreadyJoined: false,
    redirectTo,
    fulfilled
  };
}

type InviteActivity = {
  previewedCount: number;
  acceptedCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  lastPreviewedAt: string | null;
  lastAcceptedAt: string | null;
  lastEmailSentAt: string | null;
};

function buildInviteActivityMap(
  stats: Awaited<ReturnType<typeof listCourseInviteAuditStats>>
): Map<string, InviteActivity> {
  const statsByInvite = new Map<string, InviteActivity>();

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

  return statsByInvite;
}

function enrichInviteWithActivity(invite: TCourseInviteListItem, statsByInvite: Map<string, InviteActivity>) {
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
}

/**
 * Lists secure invites for a course, enriched with activity stats.
 */
export async function listStudentInvites(courseId: string) {
  const [invites, stats] = await Promise.all([listCourseInvites(courseId), listCourseInviteAuditStats(courseId)]);
  const statsByInvite = buildInviteActivityMap(stats);

  return invites.map((invite) => enrichInviteWithActivity(invite, statsByInvite));
}

export async function listPaginatedStudentInvites(courseId: string, options: { page: number; limit: number }) {
  const result = await getPaginatedCourseInvites(courseId, options);
  const stats = await listCourseInviteAuditStatsForInvites(
    courseId,
    result.items.map((invite) => invite.id)
  );
  const statsByInvite = buildInviteActivityMap(stats);

  return {
    ...result,
    items: result.items.map((invite) => enrichInviteWithActivity(invite, statsByInvite))
  };
}

export async function getStudentInviteAuditTrail(courseId: string, inviteId: string) {
  const invite = await getCourseInviteById(courseId, inviteId);
  if (!invite) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  return listCourseInviteAudit(courseId, inviteId, 200);
}

/**
 * Removes this course from a pending student's organization invite, following a replaced invite id to the live
 * invite for the same email. The invite keeps its other courses and cohorts and is revoked only when nothing is left.
 */
async function revokeCourseFromOrganizationInvite(courseId: string, inviteId: string, revokedByProfileId: string) {
  const orgId = await getOrgIdByCourseId(courseId);
  const row = orgId ? await selectOrganizationInviteWithOrgByInviteId(db, inviteId) : null;
  const orgInvite = row?.organization.id === orgId ? row?.invite : null;
  if (!orgId || !orgInvite?.email || orgInvite.roleId !== ROLE.STUDENT) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }
  if (!parseCourseIdsFromInviteMetadata(orgInvite.metadata).includes(courseId)) {
    throw new AppError('Invite not found', ErrorCodes.NOT_FOUND, 404);
  }

  if (orgInvite.acceptedAt) {
    throw new AppError('This invitation was already accepted', ErrorCodes.CONFLICT, 409);
  }

  const liveInvites = await listLiveStudentOrgInvitesForEmail(orgId, orgInvite.email);
  const carriesCourse = liveInvites.some((invite) =>
    parseCourseIdsFromInviteMetadata(invite.metadata).includes(courseId)
  );
  if (carriesCourse) {
    await revokeAudienceInviteAccess(orgId, { email: orgInvite.email, courseId }, revokedByProfileId);
  }

  return { id: orgInvite.id, status: 'REVOKED' as InviteStatus, isRevoked: true };
}

/**
 * Revokes a course invite, or removes this course from the organization invite with `inviteId`.
 */
export async function revokeStudentInvite(courseId: string, inviteId: string, revokedByProfileId: string) {
  const invite = await getCourseInviteById(courseId, inviteId);
  if (!invite) {
    return revokeCourseFromOrganizationInvite(courseId, inviteId, revokedByProfileId);
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
  const recipientEmail = data.invite.allowedEmails?.[0]?.toLowerCase().trim() || null;
  let recipientExists = false;

  if (recipientEmail) {
    try {
      const profile = await getProfileByEmail(recipientEmail);
      recipientExists = !!profile;
    } catch (error) {
      console.error('previewStudentInvite getProfileByEmail error:', error);
    }
  }
  const courseMetadata = data.course.metadata as { allowSelfEnrollment?: boolean; allowNewStudent?: boolean } | null;

  return {
    invite: {
      id: data.invite.id,
      roleId: data.invite.roleId,
      expiresAt: data.invite.expiresAt,
      maxUses: data.invite.maxUses,
      usedCount: data.invite.usedCount,
      status,
      replaced: data.invite.isRevoked && !!readSupersededBy(data.invite.metadata),
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
      allowSelfEnrollment: isSelfEnrollmentAllowed(courseMetadata),
      isPublished: data.course.isPublished,
      status: data.course.status,
      slug: data.course.slug ?? undefined,
      cost: data.course.cost
    },
    inviteContext: {
      recipientEmail,
      recipientExists
    }
  };
}

function readSupersededBy(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;

  const supersededBy = (metadata as Record<string, unknown>).supersededBy;

  return typeof supersededBy === 'string' ? supersededBy : null;
}

type InviteAcceptOptions = {
  loadBundle: (client: DbOrTxClient) => Promise<TCourseInviteAcceptBundle | null>;
  requireAllowedEmail: boolean;
};

/**
 * Accepts a student invite token and enrolls the user transactionally.
 */
export async function acceptStudentInvite(token: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  const tokenHash = hashToken(token);

  return acceptStudentInviteWith(
    {
      loadBundle: (client) => selectCourseInviteAcceptBundleByTokenHash(client, tokenHash),
      requireAllowedEmail: false
    },
    user,
    context
  );
}

/**
 * Accepts a student invite by id for a signed-in learner. Possession of an id proves nothing,
 * so the invite must name the caller's verified email.
 */
export async function acceptStudentInviteById(inviteId: string, user: TAuthUser, context: TInviteRequestContext = {}) {
  if (!user.emailVerified) {
    throw new AppError('Verify your email address to accept this invite', ErrorCodes.FORBIDDEN, 403);
  }

  return acceptStudentInviteWith(
    {
      loadBundle: (client) => selectCourseInviteAcceptBundleByInviteId(client, inviteId),
      requireAllowedEmail: true
    },
    user,
    context
  );
}

async function acceptStudentInviteWith(options: InviteAcceptOptions, user: TAuthUser, context: TInviteRequestContext) {
  if (!user.id || !user.email) {
    throw new AppError('Authenticated user email is required', ErrorCodes.UNAUTHORIZED, 401);
  }

  const normalizedEmail = user.email.toLowerCase().trim();

  const result = await db.transaction(async (tx) => {
    const inviteRow = await options.loadBundle(tx);

    if (!inviteRow) {
      throw new AppError('Invalid invite link', ErrorCodes.NOT_FOUND, 404);
    }

    if (inviteRow.invite.isRevoked && readSupersededBy(inviteRow.invite.metadata)) {
      throw new AppError('This invitation was replaced. Check your latest email.', ErrorCodes.VALIDATION_ERROR, 400);
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

    const allowedEmails = invite.allowedEmails?.map((email) => email.toLowerCase()) || [];
    const isEmailRestrictionMissing = options.requireAllowedEmail && allowedEmails.length === 0;
    if (isEmailRestrictionMissing || (allowedEmails.length > 0 && !allowedEmails.includes(normalizedEmail))) {
      throw new AppError('This invite is restricted to a different email address', ErrorCodes.INVITE_RESTRICTED, 403);
    }

    const allowedDomains = invite.allowedDomains?.map((domain) => domain.toLowerCase()) || [];
    if (allowedDomains.length > 0 && !allowedDomains.includes(getEmailDomain(normalizedEmail))) {
      throw new AppError('This invite is restricted to specific email domains', ErrorCodes.INVITE_RESTRICTED, 403);
    }

    const isEmailBound = allowedEmails.length === 1 && allowedEmails[0] === normalizedEmail;
    const identityProven = isEmailBound || user.emailVerified === true;
    const bindParams = {
      orgId: organization.id,
      profileId: user.id,
      email: normalizedEmail,
      trigger: 'course-invite' as const,
      identityProven,
      roleForNewMember: ROLE.STUDENT,
      skipInviteIds: [invite.id]
    };

    const existingMemberId = await getGroupMemberIdByGroupAndProfile(course.groupId, user.id, tx);

    if (existingMemberId) {
      const bindResult = await bindProfileInOrg(tx, bindParams);

      if (isEmailBound) {
        await markUserAndProfileEmailVerified(user.id, tx);
      }

      await recordInviteAudit(invite.id, invite.courseId, 'ACCEPTED', {
        actorProfileId: user.id,
        targetEmail: normalizedEmail,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        metadata: { alreadyJoined: true },
        deferWebhook: true
      });

      return {
        alreadyJoined: true,
        inviteId: invite.id,
        enrolledMember: null,
        courseId: course.id,
        courseName: course.title,
        orgName: organization.name,
        organizationId: organization.id,
        orgSiteName: organization.siteName,
        orgCustomDomain: organization.customDomain,
        orgIsCustomDomainVerified: organization.isCustomDomainVerified,
        orgAvatarUrl: organization.avatarUrl,
        orgTheme: organization.theme,
        welcomeEmailMessage: null,
        bindResult
      };
    }

    if (invite.roleId !== ROLE.STUDENT) {
      throw new AppError('This invite is not valid for student enrollment', ErrorCodes.UNAUTHORIZED, 403);
    }

    if (course.status !== 'ACTIVE' || !course.isPublished) {
      throw new AppError('This course is not available for enrollment', ErrorCodes.VALIDATION_ERROR, 400);
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

    const bindResult = await bindProfileInOrg(tx, bindParams);

    const consumeInvite = await optimisticIncrementCourseInviteUsedCount(tx, invite.id, invite.usedCount);

    if (!consumeInvite) {
      throw new AppError('This invite was already used. Please try another link.', ErrorCodes.VALIDATION_ERROR, 409);
    }

    const enrollment = await enrollOrganizationInviteUserCore(tx, {
      courseIds: [course.id],
      cohortIds: [],
      profileId: user.id,
      email: normalizedEmail,
      roleId: ROLE.STUDENT
    });
    const [enrolledMember] = enrollment.enrolledMembers;

    if (isEmailBound) {
      await markUserAndProfileEmailVerified(user.id, tx);
    }

    await recordInviteAudit(invite.id, invite.courseId, 'ACCEPTED', {
      actorProfileId: user.id,
      targetEmail: normalizedEmail,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { alreadyJoined: false },
      deferWebhook: true
    });

    return {
      alreadyJoined: false,
      inviteId: invite.id,
      enrolledMember: enrolledMember ?? null,
      courseId: course.id,
      courseName: course.title,
      orgName: organization.name,
      organizationId: organization.id,
      orgSiteName: organization.siteName,
      orgCustomDomain: organization.customDomain,
      orgIsCustomDomainVerified: organization.isCustomDomainVerified,
      orgAvatarUrl: organization.avatarUrl,
      orgTheme: organization.theme,
      welcomeEmailMessage:
        (course.metadata as { welcomeEmailMessage?: string | null } | null)?.welcomeEmailMessage ?? null,
      bindResult
    };
  });

  await emitInviteWebhook(result.inviteId, result.courseId, 'ACCEPTED', {
    actorProfileId: user.id,
    targetEmail: normalizedEmail
  });

  await runBindingSideEffects(result.bindResult, {
    orgId: result.organizationId,
    profileId: user.id,
    email: normalizedEmail,
    trigger: 'course-invite',
    context
  });

  if (result.enrolledMember) {
    await emitCourseMemberAddedWebhookEvent(result.courseId, result.enrolledMember, {
      source: buildMemberSource('invite', { inviteId: result.inviteId }),
      actorProfileId: user.id
    });
    captureLearnersEnrolled([result.enrolledMember], 'invite');
  }

  if (!result.alreadyJoined) {
    await invalidateOrgStats(result.organizationId);
  }

  const { createdRecords } = await ensureComplianceEnrollmentRecordsForProfiles([result.courseId], [user.id]);
  await emitComplianceEnrollmentEvents(createdRecords);

  if (!result.alreadyJoined) {
    await sendStudentJoinEmails({
      courseId: result.courseId,
      courseName: result.courseName,
      orgName: result.orgName,
      organizationId: result.organizationId,
      org: {
        siteName: result.orgSiteName,
        customDomain: result.orgCustomDomain,
        isCustomDomainVerified: result.orgIsCustomDomainVerified
      },
      branding: buildEmailBranding({
        name: result.orgName,
        avatarUrl: result.orgAvatarUrl,
        theme: result.orgTheme
      }),
      studentId: user.id,
      studentEmail: normalizedEmail,
      welcomeEmailMessage: result.welcomeEmailMessage
    });

    trackServerEvent({
      eventType: SERVER_EVENTS.ENROLLMENT_COMPLETED,
      userId: user.id,
      courseId: result.courseId,
      props: { path: 'invite' }
    });
  }

  const fulfilled = await buildFulfilledSummary(result.organizationId, result.bindResult, [result.courseId]);
  const redirectTo =
    fulfilled.courses.length > 0 ? STUDENT_HOME_ENTRY_PATH : `/courses/${result.courseId}/lessons?next=true`;

  return {
    success: true,
    alreadyJoined: result.alreadyJoined,
    redirectTo,
    fulfilled
  };
}
