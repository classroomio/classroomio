import * as z from 'zod';

import type { TWebhookEventType } from '../../constants/webhook';

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

const courseMemberInput = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string().nullable(),
    email: z.string().nullable(),
    roleId: z.number()
  })
  .strict();

const courseCompletionInput = z
  .object({
    courseId: z.string(),
    memberId: z.string(),
    profileId: z.string(),
    completedAt: z.string()
  })
  .strict();

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
  previousGradingState: z.string()
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
  'course.member.removed': courseMemberInput,
  'course.completed': courseCompletionInput,
  'course.certificate.issued': courseCompletionInput,
  'course.submission.created': submissionInput,
  'course.submission.status_changed': submissionStatusChangedInput,
  'lesson.completion.updated': lessonCompletionInput,
  'exercise.completion.updated': exerciseCompletionInput
} as const satisfies Record<TWebhookEventType, z.ZodTypeAny>;

export type TWebhookEventInput<TEvent extends TWebhookEventType> = z.infer<(typeof ZWebhookEventInput)[TEvent]>;

const personRef = z
  .object({ id: z.string().nullable(), name: z.string().nullable(), email: z.string().nullable() })
  .strict();

const courseRef = z.object({ id: z.string(), title: z.string().nullable(), slug: z.string().nullable() }).strict();

const itemRef = z.object({ id: z.string(), title: z.string().nullable() }).strict();

const organizationInviteData = organizationInviteInput.extend({ actor: personRef.nullable() });

const courseInviteData = courseInviteInput.extend({ course: courseRef, actor: personRef.nullable() });

const courseMemberData = courseMemberInput.extend({ course: courseRef, learner: personRef, role: z.string() });

const courseCompletionData = courseCompletionInput.extend({ course: courseRef, learner: personRef });

const submissionData = submissionInput.extend({
  course: courseRef,
  exercise: itemRef.nullable(),
  learner: personRef
});

const submissionStatusChangedData = submissionStatusChangedInput.extend({
  course: courseRef,
  exercise: itemRef.nullable(),
  learner: personRef
});

const lessonCompletionData = lessonCompletionInput.extend({ course: courseRef, lesson: itemRef, learner: personRef });

const exerciseCompletionData = exerciseCompletionInput.extend({
  course: courseRef,
  exercise: itemRef,
  learner: personRef
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
