import * as z from 'zod';

import {
  WEBHOOK_COMPLIANCE_TRIGGERS,
  WEBHOOK_MEMBER_SOURCE_METHODS,
  type TWebhookEventType
} from '../../constants/webhook';

const organizationInviteInput = z
  .object({
    inviteId: z.string(),
    email: z.string().nullable(),
    actorProfileId: z.string().nullable(),
    reason: z.string().nullable()
  })
  .strict();

const courseInviteInput = z
  .object({
    courseId: z.string(),
    inviteId: z.string(),
    email: z.string().nullable(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const memberSourceInput = z
  .object({
    method: z.enum(WEBHOOK_MEMBER_SOURCE_METHODS),
    inviteId: z.string().nullable(),
    inviteLinkId: z.string().nullable(),
    cohortId: z.string().nullable(),
    programId: z.string().nullable(),
    apiKeyId: z.string().nullable()
  })
  .strict();

const courseMemberBaseInput = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number(),
    enrolledAt: z.string().nullable(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const courseMemberInput = courseMemberBaseInput.extend({ source: memberSourceInput });

const courseMemberRemovedInput = courseMemberBaseInput.extend({
  reason: z.string().nullable(),
  progressAtRemoval: z
    .object({ percent: z.number(), completed: z.boolean(), lastActiveAt: z.string().nullable() })
    .strict()
    .nullable()
});

const courseCompletionInput = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string(),
    completedAt: z.string()
  })
  .strict();

const certificateInput = z
  .object({
    id: z.string().nullable(),
    displayId: z.string(),
    issuedAt: z.string(),
    expiresAt: z.string().nullable(),
    cycleNumber: z.number().nullable(),
    status: z.string()
  })
  .strict();

const certificateIssuedInput = courseCompletionInput.extend({ certificate: certificateInput });

const submissionInput = z
  .object({
    courseId: z.string(),
    submissionId: z.string(),
    exerciseId: z.string().nullable(),
    memberId: z.string().nullable(),
    profileId: z.string().nullable(),
    statusId: z.number().nullable(),
    gradingState: z.string().nullable(),
    total: z.number().nullable()
  })
  .strict();

const submissionStatusChangedInput = submissionInput.extend({
  previousStatusId: z.number(),
  previousGradingState: z.string(),
  actorProfileId: z.string().nullable()
});

const lessonCompletionInput = z
  .object({
    courseId: z.string(),
    lessonId: z.string(),
    profileId: z.string(),
    isComplete: z.boolean()
  })
  .strict();

const exerciseCompletionInput = z
  .object({
    courseId: z.string(),
    exerciseId: z.string(),
    memberId: z.string().nullable(),
    profileId: z.string().nullable(),
    isComplete: z.boolean()
  })
  .strict();

const complianceRecordInput = z
  .object({
    courseId: z.string(),
    recordId: z.string(),
    memberId: z.string().nullable(),
    profileId: z.string(),
    cycleNumber: z.number(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const complianceStatusChangedInput = complianceRecordInput.extend({
  status: z.string(),
  previousStatus: z.string().nullable(),
  trigger: z.enum(WEBHOOK_COMPLIANCE_TRIGGERS),
  dueDate: z.string().nullable(),
  validUntil: z.string().nullable()
});

const complianceWaivedInput = complianceRecordInput.extend({
  reason: z.string().nullable(),
  waiverExpiresAt: z.string().nullable()
});

const organizationMemberInput = z
  .object({
    memberId: z.string(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number(),
    status: z.string().nullable(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const organizationMemberUpdatedInput = organizationMemberInput.extend({
  changes: z.record(z.string(), z.object({ from: z.unknown(), to: z.unknown() }).strict())
});

const coursePublishInput = z
  .object({
    courseId: z.string(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const cohortMemberInput = z
  .object({
    cohortId: z.string(),
    memberId: z.string(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const lessonSessionInput = z
  .object({
    courseId: z.string(),
    lessonId: z.string(),
    startsAt: z.string().nullable(),
    previousStartsAt: z.string().nullable(),
    callUrl: z.string().nullable(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const paymentRequestInput = z
  .object({
    courseId: z.string(),
    profileId: z.string().nullable(),
    email: z.string(),
    studentName: z.string().nullable()
  })
  .strict();

/**
 * What an emitter provides for each event. The delivered `data` adds the details described by
 * {@link ZWebhookEventData}.
 */
export const ZWebhookEventInput = {
  'organization.invite.created': organizationInviteInput,
  'organization.invite.accepted': organizationInviteInput,
  'organization.invite.revoked': organizationInviteInput,
  'course.invite.created': courseInviteInput,
  'course.invite.accepted': courseInviteInput,
  'course.invite.revoked': courseInviteInput,
  'course.member.added': courseMemberInput,
  'course.member.removed': courseMemberRemovedInput,
  'course.completed': courseCompletionInput,
  'course.certificate.issued': certificateIssuedInput,
  'course.submission.created': submissionInput,
  'course.submission.status_changed': submissionStatusChangedInput,
  'lesson.completion.updated': lessonCompletionInput,
  'exercise.completion.updated': exerciseCompletionInput,
  'compliance.record.status_changed': complianceStatusChangedInput,
  'compliance.record.waived': complianceWaivedInput,
  'organization.member.added': organizationMemberInput,
  'organization.member.removed': organizationMemberInput,
  'organization.member.updated': organizationMemberUpdatedInput,
  'course.published': coursePublishInput,
  'course.unpublished': coursePublishInput,
  'cohort.member.added': cohortMemberInput,
  'cohort.member.removed': cohortMemberInput,
  'lesson.session.scheduled': lessonSessionInput,
  'course.payment_request.created': paymentRequestInput
} as const satisfies Record<TWebhookEventType, z.ZodTypeAny>;

export type TWebhookEventInput<TEvent extends TWebhookEventType> = z.infer<(typeof ZWebhookEventInput)[TEvent]>;

const personRef = z
  .object({
    id: z.string().nullable(),
    name: z.string().nullable(),
    email: z.string().nullable(),
    externalId: z.string().nullable()
  })
  .strict();

const courseRef = z
  .object({
    id: z.string(),
    title: z.string().nullable(),
    slug: z.string().nullable(),
    type: z.string().nullable(),
    isPublished: z.boolean().nullable(),
    cost: z.number().nullable(),
    currency: z.string().nullable(),
    tags: z.array(z.string())
  })
  .strict();

const itemRef = z.object({ id: z.string(), title: z.string().nullable() }).strict();

const cohortRef = z.object({ id: z.string(), name: z.string().nullable() }).strict();

const linksRef = z.object({ dashboard: z.string().nullable(), student: z.string().nullable() }).strict();

const progressRef = z
  .object({
    lessonsCompleted: z.number(),
    lessonsTotal: z.number(),
    exercisesCompleted: z.number(),
    exercisesTotal: z.number(),
    percent: z.number()
  })
  .strict();

const exerciseRef = itemRef.extend({
  maxScore: z.number().nullable(),
  passThreshold: z.number().nullable(),
  dueBy: z.string().nullable(),
  allowMultipleAttempts: z.boolean().nullable()
});

const lessonExerciseRef = itemRef.extend({ section: itemRef.nullable() });

const complianceDetailsRef = z
  .object({
    cycleNumber: z.number(),
    dueDate: z.string().nullable(),
    validUntil: z.string().nullable(),
    completedLate: z.boolean().nullable()
  })
  .strict();

const certificateData = certificateInput.extend({ downloadUrl: z.string().nullable() });

const organizationInviteData = organizationInviteInput.extend({
  actor: personRef.nullable(),
  roleId: z.number().nullable(),
  role: z.string().nullable(),
  expiresAt: z.string().nullable(),
  acceptedBy: personRef.nullable(),
  links: linksRef
});

const courseInviteData = courseInviteInput.extend({
  course: courseRef,
  actor: personRef.nullable(),
  roleId: z.number().nullable(),
  role: z.string().nullable(),
  expiresAt: z.string().nullable(),
  maxUses: z.number().nullable(),
  usedCount: z.number().nullable(),
  allowedDomains: z.array(z.string()).nullable(),
  links: linksRef
});

const courseMemberData = courseMemberInput.extend({
  course: courseRef,
  student: personRef,
  role: z.string(),
  actor: personRef.nullable(),
  links: linksRef
});

const courseMemberRemovedData = courseMemberRemovedInput.extend({
  course: courseRef,
  student: personRef,
  role: z.string(),
  actor: personRef.nullable(),
  links: linksRef
});

const courseCompletionData = courseCompletionInput.extend({
  course: courseRef,
  student: personRef,
  enrolledAt: z.string().nullable(),
  startedAt: z.string().nullable(),
  score: z.number().nullable(),
  attempts: z.number().nullable(),
  timeSpentMinutes: z.number().nullable(),
  progress: progressRef.nullable(),
  compliance: complianceDetailsRef.nullable(),
  links: linksRef
});

const certificateIssuedData = courseCompletionData.extend({ certificate: certificateData });

const submissionDetails = {
  status: z.string().nullable(),
  course: courseRef,
  exercise: exerciseRef.nullable(),
  student: personRef,
  percentage: z.number().nullable(),
  passed: z.boolean().nullable(),
  attemptNumber: z.number().nullable(),
  overallStatus: z.string().nullable(),
  submittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
  isLate: z.boolean().nullable(),
  reviewer: personRef.nullable(),
  links: linksRef
};

const submissionData = submissionInput.extend(submissionDetails);

const submissionStatusChangedData = submissionStatusChangedInput.extend({
  ...submissionDetails,
  previousStatus: z.string().nullable(),
  actor: personRef.nullable()
});

const lessonCompletionData = lessonCompletionInput.extend({
  course: courseRef,
  lesson: lessonExerciseRef,
  student: personRef,
  memberId: z.string().nullable(),
  courseProgress: progressRef.nullable(),
  links: linksRef
});

const exerciseCompletionData = exerciseCompletionInput.extend({
  course: courseRef,
  exercise: lessonExerciseRef,
  student: personRef,
  score: z.number().nullable(),
  passed: z.boolean().nullable(),
  courseProgress: progressRef.nullable(),
  links: linksRef
});

const complianceStatusChangedData = complianceStatusChangedInput.extend({
  course: courseRef,
  student: personRef,
  actor: personRef.nullable(),
  links: linksRef
});

const complianceWaivedData = complianceWaivedInput.extend({
  course: courseRef,
  student: personRef,
  actor: personRef.nullable(),
  links: linksRef
});

const organizationMemberData = organizationMemberInput.extend({
  member: personRef,
  role: z.string(),
  actor: personRef.nullable(),
  links: linksRef
});

const organizationMemberUpdatedData = organizationMemberUpdatedInput.extend({
  member: personRef,
  role: z.string(),
  actor: personRef.nullable(),
  links: linksRef
});

const coursePublishData = coursePublishInput.extend({
  course: courseRef,
  actor: personRef.nullable(),
  links: linksRef
});

const cohortMemberData = cohortMemberInput.extend({
  cohort: cohortRef,
  student: personRef,
  role: z.string(),
  actor: personRef.nullable(),
  links: linksRef
});

const lessonSessionData = lessonSessionInput.extend({
  course: courseRef,
  lesson: itemRef,
  actor: personRef.nullable(),
  links: linksRef
});

const paymentRequestData = paymentRequestInput.extend({
  course: courseRef,
  student: personRef,
  links: linksRef
});

/**
 * The `data` object sent for each event. This is the public webhook contract: the docs examples are
 * validated against these schemas. Emitters provide {@link ZWebhookEventInput}; the details are added before sending.
 */
export const ZWebhookEventData = {
  'organization.invite.created': organizationInviteData,
  'organization.invite.accepted': organizationInviteData,
  'organization.invite.revoked': organizationInviteData,
  'course.invite.created': courseInviteData,
  'course.invite.accepted': courseInviteData,
  'course.invite.revoked': courseInviteData,
  'course.member.added': courseMemberData,
  'course.member.removed': courseMemberRemovedData,
  'course.completed': courseCompletionData,
  'course.certificate.issued': certificateIssuedData,
  'course.submission.created': submissionData,
  'course.submission.status_changed': submissionStatusChangedData,
  'lesson.completion.updated': lessonCompletionData,
  'exercise.completion.updated': exerciseCompletionData,
  'compliance.record.status_changed': complianceStatusChangedData,
  'compliance.record.waived': complianceWaivedData,
  'organization.member.added': organizationMemberData,
  'organization.member.removed': organizationMemberData,
  'organization.member.updated': organizationMemberUpdatedData,
  'course.published': coursePublishData,
  'course.unpublished': coursePublishData,
  'cohort.member.added': cohortMemberData,
  'cohort.member.removed': cohortMemberData,
  'lesson.session.scheduled': lessonSessionData,
  'course.payment_request.created': paymentRequestData
} as const satisfies Record<TWebhookEventType, z.ZodTypeAny>;

export type TWebhookEventData<TEvent extends TWebhookEventType> = z.infer<(typeof ZWebhookEventData)[TEvent]>;

export type TCourseWebhookEventType = Exclude<TWebhookEventType, `organization.${string}` | `cohort.${string}`>;
