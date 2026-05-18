import * as z from 'zod';
import { ROLE } from '@cio/utils/constants';

export const ZCreateProgram = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional()
});
export type TCreateProgram = z.infer<typeof ZCreateProgram>;

export const ZUpdateProgram = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional()
});
export type TUpdateProgram = z.infer<typeof ZUpdateProgram>;

export const ZAddCourseToProgram = z.object({
  courseId: z.string().uuid()
});
export type TAddCourseToProgram = z.infer<typeof ZAddCourseToProgram>;

export const ZAddProgramMembers = z.object({
  members: z
    .array(
      z.object({
        profileId: z.string().uuid().optional(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        roleId: z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
      })
    )
    .min(1)
    .refine((members) => members.every((member) => member.profileId || member.email), {
      message: 'Each member must include a profileId or email'
    })
});
export type TAddProgramMembers = z.infer<typeof ZAddProgramMembers>;

export const ZUpdateProgramMember = z.object({
  roleId: z.union([z.literal(ROLE.TUTOR), z.literal(ROLE.STUDENT)])
});
export type TUpdateProgramMember = z.infer<typeof ZUpdateProgramMember>;

export const ZCreateProgramNewsfeed = z.object({
  content: z.string().min(1),
  isPinned: z.boolean().optional()
});
export type TCreateProgramNewsfeed = z.infer<typeof ZCreateProgramNewsfeed>;

export const ZUpdateProgramNewsfeed = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional()
});
export type TUpdateProgramNewsfeed = z.infer<typeof ZUpdateProgramNewsfeed>;

export const ZUpdateProgramReaction = z.object({
  reaction: z.object({
    clap: z.array(z.string()),
    smile: z.array(z.string()),
    thumbsup: z.array(z.string()),
    thumbsdown: z.array(z.string())
  })
});
export type TUpdateProgramReaction = z.infer<typeof ZUpdateProgramReaction>;

export const ZCreateProgramNewsfeedComment = z.object({
  content: z.string().min(1)
});
export type TCreateProgramNewsfeedComment = z.infer<typeof ZCreateProgramNewsfeedComment>;

export const ZInviteStudentsToProgram = z.object({
  recipientCsv: z.string().min(1).max(25000),
  sendEmail: z.boolean().default(true)
});
export type TInviteStudentsToProgram = z.infer<typeof ZInviteStudentsToProgram>;

export const ZAssignExistingStudentsToProgram = z.object({
  profileIds: z.array(z.string().uuid()).min(1).max(500),
  sendEmail: z.boolean().default(true)
});
export type TAssignExistingStudentsToProgram = z.infer<typeof ZAssignExistingStudentsToProgram>;

// ─── Program Goals ────────────────────────────────────────────────────────────

export const PROGRAM_GOAL_TYPES = ['complete_all', 'n_of_m', 'score', 'pass_rate', 'readiness'] as const;
export const PROGRAM_GOAL_DEADLINE_KINDS = ['absolute', 'relative_to_join', 'recurring', 'none'] as const;

const goalCommonFields = {
  title: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().optional(),
  courseIds: z.array(z.string().uuid()).max(50),
  reminderDaysBefore: z.array(z.number().int().min(0).max(365)).max(5).default([7, 1])
};

const goalDeadlineFields = {
  deadlineKind: z.enum(PROGRAM_GOAL_DEADLINE_KINDS).default('none'),
  deadlineDate: z.string().datetime().nullable().optional(),
  relativeDays: z.number().int().min(1).max(3650).nullable().optional(),
  recurringMonths: z.number().int().min(1).max(120).nullable().optional()
};

/**
 * Goal config across the five v1 types. We keep this as one schema (not a
 * discriminated union) so the form layer can update fields incrementally; the
 * service layer enforces the per-type required fields.
 */
export const ZCreateProgramGoal = z
  .object({
    type: z.enum(PROGRAM_GOAL_TYPES),
    requiredCount: z.number().int().min(1).max(50).nullable().optional(),
    scoreThreshold: z.number().int().min(0).max(100).nullable().optional(),
    teamPassRateThreshold: z.number().int().min(0).max(100).nullable().optional(),
    ...goalCommonFields,
    ...goalDeadlineFields
  })
  .refine((data) => data.courseIds.length > 0, {
    message: 'At least one course is required',
    path: ['courseIds']
  })
  .refine((data) => data.type !== 'n_of_m' || (data.requiredCount && data.requiredCount > 0), {
    message: 'requiredCount is required for n_of_m goals',
    path: ['requiredCount']
  })
  .refine((data) => data.type !== 'n_of_m' || !data.requiredCount || data.requiredCount <= data.courseIds.length, {
    message: 'requiredCount cannot exceed selected courses',
    path: ['requiredCount']
  })
  .refine((data) => data.type !== 'score' || (data.scoreThreshold !== null && data.scoreThreshold !== undefined), {
    message: 'scoreThreshold is required for score goals',
    path: ['scoreThreshold']
  })
  .refine(
    (data) =>
      data.type !== 'pass_rate' ||
      (data.scoreThreshold !== null &&
        data.scoreThreshold !== undefined &&
        data.teamPassRateThreshold !== null &&
        data.teamPassRateThreshold !== undefined),
    {
      message: 'scoreThreshold and teamPassRateThreshold are required for pass_rate goals',
      path: ['teamPassRateThreshold']
    }
  )
  .refine((data) => data.deadlineKind !== 'absolute' || !!data.deadlineDate, {
    message: 'deadlineDate is required for absolute deadlines',
    path: ['deadlineDate']
  })
  .refine((data) => data.deadlineKind !== 'relative_to_join' || !!data.relativeDays, {
    message: 'relativeDays is required for relative-to-join deadlines',
    path: ['relativeDays']
  })
  .refine((data) => data.deadlineKind !== 'recurring' || !!data.recurringMonths, {
    message: 'recurringMonths is required for recurring deadlines',
    path: ['recurringMonths']
  })
  .refine((data) => data.type !== 'readiness' || data.deadlineKind === 'none', {
    message: 'Readiness goals do not support deadlines',
    path: ['deadlineKind']
  });

export type TCreateProgramGoal = z.infer<typeof ZCreateProgramGoal>;

export const ZUpdateProgramGoal = z
  .object({
    type: z.enum(PROGRAM_GOAL_TYPES).optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    courseIds: z.array(z.string().uuid()).max(50).optional(),
    requiredCount: z.number().int().min(1).max(50).nullable().optional(),
    scoreThreshold: z.number().int().min(0).max(100).nullable().optional(),
    teamPassRateThreshold: z.number().int().min(0).max(100).nullable().optional(),
    reminderDaysBefore: z.array(z.number().int().min(0).max(365)).max(5).optional(),
    deadlineKind: z.enum(PROGRAM_GOAL_DEADLINE_KINDS).optional(),
    deadlineDate: z.string().datetime().nullable().optional(),
    relativeDays: z.number().int().min(1).max(3650).nullable().optional(),
    recurringMonths: z.number().int().min(1).max(120).nullable().optional(),
    status: z.enum(['active', 'archived']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No fields to update'
  });

export type TUpdateProgramGoal = z.infer<typeof ZUpdateProgramGoal>;
