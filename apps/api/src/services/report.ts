import {
  createContentReport,
  findActiveContentReport,
  getContentReportById,
  listContentReports,
  updateContentReport
} from '@cio/db/queries/report';
import { resolveReportTarget, type ResolvedReportTarget } from '@cio/db/queries/report/targets';
import { getOrganizationById } from '@cio/db/queries/organization';
import { isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { isCohortMember, isOrgAdminByCohortId } from '@cio/db/queries/cohort';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { isUniqueConstraintViolation } from '@cio/utils/errors';
import { enqueueTransactionalEmail } from '@api/services/jobs/email-jobs';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { env } from '@cio/core/config/env';
import type {
  TContentReportReason,
  TCreateContentReport,
  TListContentReportsQuery,
  TUpdateContentReport
} from '@cio/utils/validation/report';

const HIGH_PRIORITY_REASONS = new Set<TContentReportReason>(['hate_speech', 'sexual_content', 'violence']);
const DEFAULT_MODERATION_EMAIL = 'help@classroomio.com';
const EXCERPT_MAX_LENGTH = 280;

function toAbsoluteContentUrl(path: string | null | undefined): string | undefined {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

function toExcerpt(text: string): string {
  if (text.length <= EXCERPT_MAX_LENGTH) {
    return text;
  }

  return `${text.slice(0, EXCERPT_MAX_LENGTH).trimEnd()}…`;
}

async function canReporterAccessTarget(input: {
  reporterId: string;
  orgId: string;
  target: ResolvedReportTarget;
}): Promise<boolean> {
  if (input.target.organizationId !== input.orgId) {
    return false;
  }

  switch (input.target.targetType) {
    case 'course_newsfeed_post':
    case 'course_newsfeed_comment':
    case 'lesson_comment': {
      if (!input.target.courseId) {
        return false;
      }

      return isUserCourseMemberOrOrgAdmin(input.target.courseId, input.reporterId);
    }
    case 'cohort_newsfeed_post':
    case 'cohort_newsfeed_comment': {
      if (!input.target.cohortId) {
        return false;
      }

      const [member, isOrgAdmin] = await Promise.all([
        isCohortMember(input.target.cohortId, input.reporterId),
        isOrgAdminByCohortId(input.target.cohortId, input.reporterId)
      ]);

      return member || isOrgAdmin;
    }
    case 'community_question':
    case 'community_answer':
    case 'profile':
      return true;
    default:
      return false;
  }
}

async function notifyModerators(input: {
  reportId: string;
  reason: TContentReportReason;
  details?: string;
  targetType: string;
  targetId: string;
  orgId: string;
  orgName: string;
  reporterId: string;
  authorId: string | null;
  excerpt: string;
  contentUrl?: string;
}) {
  const moderationEmail = env.MODERATION_EMAIL || DEFAULT_MODERATION_EMAIL;

  try {
    await enqueueTransactionalEmail('contentReportAlert', {
      to: moderationEmail,
      fields: {
        reportId: input.reportId,
        reason: input.reason,
        details: input.details ?? '',
        targetType: input.targetType,
        targetId: input.targetId,
        orgName: input.orgName,
        orgId: input.orgId,
        reporterId: input.reporterId,
        authorId: input.authorId ?? '',
        excerpt: input.excerpt,
        contentUrl: input.contentUrl ?? ''
      },
      idempotencyKey: `content-report:${input.reportId}`
    });
  } catch (error) {
    console.error('Failed to enqueue content report alert email:', error);
  }
}

export async function submitContentReport(input: { orgId: string; reporterId: string; payload: TCreateContentReport }) {
  const target = await resolveReportTarget(input.orgId, input.payload.targetType, input.payload.targetId);

  if (!target) {
    throw new AppError('Content not found', ErrorCodes.REPORT_INVALID_TARGET, 404);
  }

  const canAccessTarget = await canReporterAccessTarget({
    reporterId: input.reporterId,
    orgId: input.orgId,
    target
  });

  if (!canAccessTarget) {
    throw new AppError('Content not found', ErrorCodes.REPORT_INVALID_TARGET, 404);
  }

  if (target.authorProfileId && target.authorProfileId === input.reporterId) {
    throw new AppError('You cannot report your own content', ErrorCodes.REPORT_FORBIDDEN, 400);
  }

  const existingReport = await findActiveContentReport({
    organizationId: input.orgId,
    reporterId: input.reporterId,
    targetType: input.payload.targetType,
    targetId: input.payload.targetId
  });

  if (existingReport) {
    throw new AppError('You have already reported this content', ErrorCodes.REPORT_ALREADY_SUBMITTED, 409);
  }

  const organization = await getOrganizationById(input.orgId);
  const orgName = organization?.name || 'Unknown organization';
  const contentUrl = toAbsoluteContentUrl(target.snapshot.url);
  const snapshot = {
    ...target.snapshot,
    url: contentUrl ?? target.snapshot.url ?? null
  };
  const priority = HIGH_PRIORITY_REASONS.has(input.payload.reason) ? 1 : 2;

  let report;

  try {
    report = await createContentReport({
      organizationId: input.orgId,
      reporterId: input.reporterId,
      targetType: input.payload.targetType,
      targetId: input.payload.targetId,
      targetAuthorId: target.authorProfileId,
      reason: input.payload.reason,
      details: input.payload.details,
      status: 'open',
      priority,
      contentSnapshot: snapshot
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) {
      throw new AppError('You have already reported this content', ErrorCodes.REPORT_ALREADY_SUBMITTED, 409);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Failed to submit report', ErrorCodes.REPORT_CREATE_FAILED, 500);
  }

  await notifyModerators({
    reportId: report.id,
    reason: input.payload.reason,
    details: input.payload.details,
    targetType: input.payload.targetType,
    targetId: input.payload.targetId,
    orgId: input.orgId,
    orgName,
    reporterId: input.reporterId,
    authorId: target.authorProfileId,
    excerpt: toExcerpt(snapshot.text),
    contentUrl
  });

  return {
    id: report.id,
    status: report.status
  };
}

export async function listModerationReports(query: TListContentReportsQuery) {
  const result = await listContentReports(query);
  const totalPages = Math.ceil(result.total / query.limit) || 1;

  return {
    items: result.items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages
    }
  };
}

export async function getModerationReport(id: string) {
  const report = await getContentReportById(id);

  if (!report) {
    throw new AppError('Report not found', ErrorCodes.REPORT_NOT_FOUND, 404);
  }

  return report;
}

export async function updateModerationReport(id: string, payload: TUpdateContentReport) {
  const existing = await getContentReportById(id);

  if (!existing) {
    throw new AppError('Report not found', ErrorCodes.REPORT_NOT_FOUND, 404);
  }

  const nextStatus = payload.status ?? existing.status;
  const isTerminal = nextStatus === 'actioned' || nextStatus === 'dismissed';
  const wasTerminal = existing.status === 'actioned' || existing.status === 'dismissed';
  const updatedAt = new Date().toISOString();

  const updatePayload: Parameters<typeof updateContentReport>[1] = {
    status: payload.status,
    assignedTo: payload.assignedTo,
    updatedAt
  };

  if (isTerminal) {
    updatePayload.resolutionCode = payload.resolutionCode;
    updatePayload.resolutionNote = payload.resolutionNote;
    updatePayload.resolvedAt = existing.resolvedAt || updatedAt;
  } else if (wasTerminal) {
    updatePayload.resolutionCode = null;
    updatePayload.resolutionNote = null;
    updatePayload.resolvedAt = null;
    updatePayload.reviewedBy = null;
  } else {
    updatePayload.resolutionCode = payload.resolutionCode;
    updatePayload.resolutionNote = payload.resolutionNote;
  }

  const updated = await updateContentReport(id, updatePayload);

  if (!updated) {
    throw new AppError('Failed to update report', ErrorCodes.REPORT_UPDATE_FAILED, 500);
  }

  return updated;
}
