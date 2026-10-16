import * as z from 'zod';

import type { TWebhookEventType } from '../../constants/webhook';

const organizationInviteData = z
  .object({
    inviteId: z.string(),
    email: z.string().nullable(),
    actorProfileId: z.string().nullable(),
    reason: z.string().nullable()
  })
  .strict();

const courseInviteData = z
  .object({
    courseId: z.string(),
    inviteId: z.string(),
    email: z.string().nullable(),
    actorProfileId: z.string().nullable()
  })
  .strict();

const courseMemberData = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number()
  })
  .strict();

const courseCompletionData = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string(),
    completedAt: z.string()
  })
  .strict();

const submissionData = z
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

const submissionStatusChangedData = submissionData.extend({
  previousStatusId: z.number(),
  previousGradingState: z.string()
});

const lessonCompletionData = z
  .object({
    courseId: z.string(),
    lessonId: z.string(),
    profileId: z.string(),
    isComplete: z.boolean()
  })
  .strict();

const exerciseCompletionData = z
  .object({
    courseId: z.string(),
    exerciseId: z.string(),
    memberId: z.string().nullable(),
    profileId: z.string().nullable(),
    isComplete: z.boolean()
  })
  .strict();

/**
 * The `data` object sent for each event. This is the public webhook contract: the docs examples are
 * validated against these schemas, and the emitters are typed from them.
 */
export const ZWebhookEventData = {
  'organization.invite.created': organizationInviteData,
  'organization.invite.accepted': organizationInviteData,
  'organization.invite.revoked': organizationInviteData,
  'course.invite.created': courseInviteData,
  'course.invite.accepted': courseInviteData,
  'course.invite.revoked': courseInviteData,
  'course.member.added': courseMemberData,
  'course.member.removed': courseMemberData,
  'course.completed': courseCompletionData,
  'course.certificate.issued': courseCompletionData,
  'course.submission.created': submissionData,
  'course.submission.status_changed': submissionStatusChangedData,
  'lesson.completion.updated': lessonCompletionData,
  'exercise.completion.updated': exerciseCompletionData
} as const satisfies Record<TWebhookEventType, z.ZodTypeAny>;

export type TWebhookEventData<TEvent extends TWebhookEventType> = z.infer<(typeof ZWebhookEventData)[TEvent]>;

export type TCourseWebhookEventType = Exclude<TWebhookEventType, `organization.${string}`>;
