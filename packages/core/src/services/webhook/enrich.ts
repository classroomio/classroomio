import { getCourseProgress } from '@cio/db/queries/course/course';
import { getOrganizationById } from '@cio/db/queries/organization';
import {
  getWebhookCertificateIssue,
  getWebhookCohortName,
  getWebhookCompletionRecord,
  getWebhookCourseInviteDetails,
  getWebhookEventContext,
  getWebhookExerciseDetails,
  getWebhookLatestSubmissionScore,
  getWebhookLessonSection,
  getWebhookMemberDetails,
  getWebhookMemberIdForProfile,
  getWebhookOrganizationInviteDetails,
  getWebhookSubmissionDetails,
  type TWebhookEventContext,
  type TWebhookExerciseDetails,
  type TWebhookInviteDetails
} from '@cio/db/queries/webhook';
import { ROLE } from '@cio/utils/constants';
import type { TWebhookEventType } from '@cio/utils/constants/webhook';

import { buildCertificateDownloadUrl, buildWebhookLinks } from './links';

const ROLE_LABELS: Record<number, string> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.TUTOR]: 'tutor',
  [ROLE.STUDENT]: 'student'
};

const EMPTY_CONTEXT: TWebhookEventContext = {
  profiles: new Map(),
  course: null,
  statusLabels: new Map(),
  exercise: null,
  lesson: null
};

type TProgress = {
  lessonsCompleted: number;
  lessonsTotal: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  percent: number;
};

type TDetails = {
  invite: TWebhookInviteDetails | null;
  memberEnrolledAt: string | null;
  memberId: string | null;
  completionRecord: Awaited<ReturnType<typeof getWebhookCompletionRecord>>;
  progress: TProgress | null;
  exercise: TWebhookExerciseDetails | null;
  lessonSection: { id: string; title: string | null } | null;
  submission: Awaited<ReturnType<typeof getWebhookSubmissionDetails>>;
  latestScore: number | null;
  cohortName: string | null;
  certificateRow: Awaited<ReturnType<typeof getWebhookCertificateIssue>>;
};

const EMPTY_DETAILS: TDetails = {
  invite: null,
  memberEnrolledAt: null,
  memberId: null,
  completionRecord: null,
  progress: null,
  exercise: null,
  lessonSection: null,
  submission: null,
  latestScore: null,
  cohortName: null,
  certificateRow: null
};

function readNumber(data: Record<string, unknown>, key: string): number | null {
  const value = data[key];

  return typeof value === 'number' ? value : null;
}

function readString(data: Record<string, unknown>, key: string): string | null {
  const value = data[key];

  return typeof value === 'string' ? value : null;
}

function settled<T>(label: string, result: PromiseSettledResult<T>, fallback: T): T {
  if (result.status === 'fulfilled') return result.value;

  console.error('enrichWebhookEventData lookup error:', { label, error: result.reason });

  return fallback;
}

async function loadProgress(courseId: string | null, profileId: string | null): Promise<TProgress | null> {
  if (!courseId || !profileId) return null;

  const progress = await getCourseProgress(courseId, profileId);
  const total = progress.lessonsCount + progress.exercisesCount;

  if (!progress.groupMemberId) return null;

  const completed = progress.lessonsCompleted + progress.exercisesCompleted;

  return {
    lessonsCompleted: progress.lessonsCompleted,
    lessonsTotal: progress.lessonsCount,
    exercisesCompleted: progress.exercisesCompleted,
    exercisesTotal: progress.exercisesCount,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
}

async function loadDetails(eventType: TWebhookEventType, data: Record<string, unknown>): Promise<TDetails> {
  const courseId = readString(data, 'courseId');
  const profileId = readString(data, 'profileId');
  const memberId = readString(data, 'memberId');
  const inviteId = readString(data, 'inviteId');
  const exerciseId = readString(data, 'exerciseId');
  const lessonId = readString(data, 'lessonId');
  const submissionId = readString(data, 'submissionId');
  const cohortId = readString(data, 'cohortId');
  const isCompletionEvent = eventType === 'course.completed' || eventType === 'course.certificate.issued';
  const isSubmissionEvent = eventType.startsWith('course.submission.');
  const isInviteEvent = eventType.endsWith('.invite.created') || eventType.includes('.invite.');
  const needsProgress =
    isCompletionEvent || eventType === 'lesson.completion.updated' || eventType === 'exercise.completion.updated';

  const [
    inviteResult,
    memberResult,
    memberIdResult,
    recordResult,
    progressResult,
    exerciseResult,
    sectionResult,
    submissionResult,
    scoreResult,
    cohortResult,
    certificateResult
  ] = await Promise.allSettled([
    inviteId && isInviteEvent
      ? eventType.startsWith('organization.')
        ? getWebhookOrganizationInviteDetails(inviteId)
        : getWebhookCourseInviteDetails(inviteId)
      : null,
    isCompletionEvent && memberId ? getWebhookMemberDetails(memberId) : null,
    eventType === 'lesson.completion.updated' && courseId && profileId
      ? getWebhookMemberIdForProfile(courseId, profileId)
      : null,
    isCompletionEvent && courseId && profileId ? getWebhookCompletionRecord(courseId, profileId) : null,
    needsProgress ? loadProgress(courseId, profileId) : null,
    exerciseId && (isSubmissionEvent || eventType === 'exercise.completion.updated')
      ? getWebhookExerciseDetails(exerciseId)
      : null,
    eventType === 'lesson.completion.updated' && lessonId ? getWebhookLessonSection(lessonId) : null,
    isSubmissionEvent && submissionId ? getWebhookSubmissionDetails(submissionId) : null,
    eventType === 'exercise.completion.updated' && exerciseId && memberId
      ? getWebhookLatestSubmissionScore(exerciseId, memberId)
      : null,
    cohortId ? getWebhookCohortName(cohortId) : null,
    eventType === 'course.certificate.issued' && courseId && profileId
      ? getWebhookCertificateIssue(courseId, profileId)
      : null
  ]);

  const member = settled('member', memberResult, null);

  return {
    invite: settled('invite', inviteResult, null),
    memberEnrolledAt: member?.enrolledAt ?? null,
    memberId: settled('memberId', memberIdResult, null),
    completionRecord: settled('completionRecord', recordResult, null),
    progress: settled('progress', progressResult, null),
    exercise: settled('exercise', exerciseResult, null),
    lessonSection: settled('lessonSection', sectionResult, null),
    submission: settled('submission', submissionResult, null),
    latestScore: settled('latestScore', scoreResult, null),
    cohortName: settled('cohortName', cohortResult, null),
    certificateRow: settled('certificate', certificateResult, null)
  };
}

async function loadContext(
  organizationId: string,
  data: Record<string, unknown>,
  extraProfileIds: Array<string | null>
): Promise<TWebhookEventContext> {
  const profileIds = [readString(data, 'profileId'), readString(data, 'actorProfileId'), ...extraProfileIds].filter(
    (id): id is string => id !== null
  );

  try {
    const statusIds = [readNumber(data, 'statusId'), readNumber(data, 'previousStatusId')].filter(
      (id): id is number => id !== null
    );

    return await getWebhookEventContext({
      organizationId,
      profileIds,
      statusIds,
      courseId: readString(data, 'courseId') ?? undefined,
      exerciseId: readString(data, 'exerciseId') ?? undefined,
      lessonId: readString(data, 'lessonId') ?? undefined
    });
  } catch (error) {
    console.error('loadContext webhook details error:', error);

    return EMPTY_CONTEXT;
  }
}

function toPersonRef(
  profileId: string | null,
  email: string | null,
  profiles: TWebhookEventContext['profiles'],
  fallbackName: string | null = null
): { id: string | null; name: string | null; email: string | null; externalId: string | null } {
  const profile = profileId ? profiles.get(profileId) : undefined;

  return {
    id: profileId,
    name: profile?.name ?? fallbackName,
    email: email ?? profile?.email ?? null,
    externalId: profile?.externalId ?? null
  };
}

/**
 * Same rule as exercise completion: the percentage is rounded to a whole number before it meets the threshold.
 */
function resolvePassed(percentage: number | null, passThreshold: number | null): boolean | null {
  if (percentage === null || passThreshold === null) return null;

  return Math.round(percentage) >= passThreshold;
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function toIsoOrNull(value: string | null | undefined): string | null {
  if (!value) return null;

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function applyInviteDetails(enriched: Record<string, unknown>, details: TDetails) {
  const invite = details.invite;

  enriched.roleId = invite?.roleId ?? null;
  enriched.role = invite ? (ROLE_LABELS[invite.roleId] ?? 'unknown') : null;
  enriched.expiresAt = toIsoOrNull(invite?.expiresAt);
}

function applyAcceptedBy(
  enriched: Record<string, unknown>,
  details: TDetails,
  profiles: TWebhookEventContext['profiles']
) {
  const acceptedByProfileId = details.invite?.acceptedByProfileId ?? null;

  enriched.acceptedBy = acceptedByProfileId ? toPersonRef(acceptedByProfileId, null, profiles) : null;
}

function applyCourseInviteDetails(enriched: Record<string, unknown>, details: TDetails) {
  enriched.maxUses = details.invite?.maxUses ?? null;
  enriched.usedCount = details.invite?.usedCount ?? null;
  enriched.allowedDomains = details.invite?.allowedDomains ?? null;
}

function applyCompletionDetails(enriched: Record<string, unknown>, details: TDetails) {
  const record = details.completionRecord;
  const completedAt = readString(enriched, 'completedAt');

  enriched.enrolledAt = toIsoOrNull(details.memberEnrolledAt);
  enriched.startedAt = toIsoOrNull(record?.startedAt);
  enriched.score = record?.score ?? null;
  enriched.attempts = record?.attempts ?? null;
  enriched.timeSpentMinutes = record?.timeSpentMinutes ?? null;
  enriched.progress = details.progress;

  if (!record) {
    enriched.compliance = null;

    return;
  }

  const completedLate = completedAt ? new Date(completedAt).getTime() > new Date(record.dueDate).getTime() : null;

  enriched.compliance = {
    cycleNumber: record.cycleNumber,
    dueDate: toIsoOrNull(record.dueDate),
    validUntil: toIsoOrNull(record.validUntil),
    completedLate
  };
}

function applySubmissionDetails(
  enriched: Record<string, unknown>,
  details: TDetails,
  profiles: TWebhookEventContext['profiles']
) {
  const exercise = details.exercise;
  const submission = details.submission;
  const total = typeof enriched.total === 'number' ? enriched.total : null;
  const maxScore = exercise && exercise.maxScore > 0 ? exercise.maxScore : null;
  const percentage = total !== null && maxScore !== null ? roundPercent((total / maxScore) * 100) : null;
  const passThreshold = exercise?.passThreshold ?? null;
  const submittedAt = toIsoOrNull(submission?.submittedAt);
  const dueBy = toIsoOrNull(exercise?.dueBy);

  if (exercise && enriched.exercise && typeof enriched.exercise === 'object') {
    enriched.exercise = {
      ...(enriched.exercise as Record<string, unknown>),
      maxScore: exercise.maxScore,
      passThreshold,
      dueBy,
      allowMultipleAttempts: exercise.allowMultipleAttempts
    };
  } else if (enriched.exercise && typeof enriched.exercise === 'object') {
    enriched.exercise = {
      ...(enriched.exercise as Record<string, unknown>),
      maxScore: null,
      passThreshold: null,
      dueBy: null,
      allowMultipleAttempts: null
    };
  }

  const gradedBy = submission?.gradedBy ?? null;

  enriched.reviewer = gradedBy ? toPersonRef(gradedBy, null, profiles) : null;
  enriched.percentage = percentage;
  enriched.passed = resolvePassed(percentage, passThreshold);
  enriched.attemptNumber = submission?.attemptNumber ?? null;
  enriched.overallStatus = submission?.overallStatus ?? null;
  enriched.submittedAt = submittedAt;
  enriched.gradedAt = submission?.gradingState === 'completed' ? toIsoOrNull(submission.updatedAt) : null;
  enriched.isLate = submittedAt && dueBy ? new Date(submittedAt).getTime() > new Date(dueBy).getTime() : null;
}

function applyLessonOrExerciseDetails(
  enriched: Record<string, unknown>,
  eventType: TWebhookEventType,
  details: TDetails
) {
  const key = eventType === 'lesson.completion.updated' ? 'lesson' : 'exercise';
  const section =
    key === 'lesson'
      ? details.lessonSection
      : details.exercise?.sectionId
        ? { id: details.exercise.sectionId, title: details.exercise.sectionTitle }
        : null;

  enriched[key] = { ...(enriched[key] as Record<string, unknown>), section };
  enriched.courseProgress = details.progress;

  if (key === 'lesson') {
    enriched.memberId = details.memberId;

    return;
  }

  const maxScore = details.exercise && details.exercise.maxScore > 0 ? details.exercise.maxScore : null;
  const percentage =
    details.latestScore !== null && maxScore !== null ? roundPercent((details.latestScore / maxScore) * 100) : null;
  const passThreshold = details.exercise?.passThreshold ?? null;

  enriched.score = details.latestScore;
  enriched.passed = resolvePassed(percentage, passThreshold);
}

/**
 * Adds the readable details (people, course, exercise, lesson, role, status, links and the per-event
 * figures) next to the ids an event was created with. The existing fields are kept as they are.
 * Details that cannot be read come back as `null` so the event is still sent.
 */
export async function enrichWebhookEventData(
  organizationId: string,
  eventType: TWebhookEventType,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const [organization, details] = await Promise.all([
    getOrganizationById(organizationId).catch((error: unknown) => {
      console.error('enrichWebhookEventData organization lookup error:', error);

      return null;
    }),
    loadDetails(eventType, data).catch((error: unknown) => {
      console.error('enrichWebhookEventData details error:', error);

      return EMPTY_DETAILS;
    })
  ]);
  const context = await loadContext(organizationId, data, [
    details.invite?.acceptedByProfileId ?? null,
    details.submission?.gradedBy ?? null
  ]);
  const enriched: Record<string, unknown> = { ...data };
  const courseId = readString(data, 'courseId');
  const exerciseId = readString(data, 'exerciseId');
  const lessonId = readString(data, 'lessonId');
  const isOrganizationMember = eventType.startsWith('organization.member.');

  if (courseId) {
    enriched.course = {
      id: courseId,
      title: context.course?.title ?? null,
      slug: context.course?.slug ?? null,
      type: context.course?.type ?? null,
      isPublished: context.course?.isPublished ?? null,
      cost: context.course?.cost ?? null,
      currency: context.course?.currency ?? null,
      tags: context.course?.tags ?? []
    };
  }

  if (exerciseId) {
    enriched.exercise = { id: exerciseId, title: context.exercise?.title ?? null };
  } else if ('exerciseId' in data) {
    enriched.exercise = null;
  }

  if (lessonId) {
    enriched.lesson = { id: lessonId, title: context.lesson?.title ?? null };
  }

  if (readString(data, 'cohortId')) {
    enriched.cohort = { id: readString(data, 'cohortId'), name: details.cohortName };
  }

  if ('profileId' in data) {
    const person = toPersonRef(
      readString(data, 'profileId'),
      readString(data, 'email'),
      context.profiles,
      readString(data, 'studentName')
    );

    if (isOrganizationMember) {
      enriched.member = person;
    } else {
      enriched.student = person;
    }
  }

  if ('actorProfileId' in data) {
    const actorId = readString(data, 'actorProfileId');
    enriched.actor = actorId ? toPersonRef(actorId, null, context.profiles) : null;
  }

  if ('statusId' in data) {
    const statusId = readNumber(data, 'statusId');
    enriched.status = statusId === null ? null : (context.statusLabels.get(statusId) ?? null);
  }

  if ('previousStatusId' in data) {
    const previousStatusId = readNumber(data, 'previousStatusId');
    enriched.previousStatus = previousStatusId === null ? null : (context.statusLabels.get(previousStatusId) ?? null);
  }

  if (typeof data.roleId === 'number') {
    enriched.role = ROLE_LABELS[data.roleId] ?? 'unknown';
  }

  if (eventType.includes('.invite.')) {
    applyInviteDetails(enriched, details);

    if (eventType.startsWith('course.')) {
      applyCourseInviteDetails(enriched, details);
    } else {
      applyAcceptedBy(enriched, details, context.profiles);
    }
  }

  if (eventType === 'course.completed' || eventType === 'course.certificate.issued') {
    applyCompletionDetails(enriched, details);
  }

  if (eventType === 'course.certificate.issued' && courseId && typeof data.certificate === 'object') {
    const downloadUrl = buildCertificateDownloadUrl(courseId, organization);

    enriched.certificate = { ...(data.certificate as Record<string, unknown>), downloadUrl };
  }

  if (eventType.startsWith('course.submission.')) {
    applySubmissionDetails(enriched, details, context.profiles);
  }

  if (eventType === 'lesson.completion.updated' || eventType === 'exercise.completion.updated') {
    applyLessonOrExerciseDetails(enriched, eventType, details);
  }

  enriched.links = buildWebhookLinks(eventType, data, organization);

  return enriched;
}
