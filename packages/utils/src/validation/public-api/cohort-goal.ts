import * as z from 'zod';

import { ZPublicApiCohortParam } from './cohort';

const GOAL_TYPES = ['complete_all', 'n_of_m', 'score', 'pass_rate', 'readiness'] as const;
const GOAL_DEADLINE_KINDS = ['absolute', 'relative_to_join', 'recurring', 'none'] as const;

export const ZPublicApiCohortGoalParam = ZPublicApiCohortParam.extend({
  goalId: z.string().uuid()
});
export type TPublicApiCohortGoalParam = z.infer<typeof ZPublicApiCohortGoalParam>;

export const ZPublicApiCreateCohortGoal = z
  .object({
    type: z.enum(GOAL_TYPES),
    title: z.string().min(1).max(255),
    description: z.string().max(2000).nullable().optional(),
    courseIds: z.array(z.string().uuid()).max(50),
    requiredCount: z.number().int().min(1).max(50).nullable().optional(),
    scoreThreshold: z.number().int().min(0).max(100).nullable().optional(),
    teamPassRateThreshold: z.number().int().min(0).max(100).nullable().optional(),
    reminderDaysBefore: z.array(z.number().int().min(0).max(365)).max(5).default([7, 1]),
    deadlineKind: z.enum(GOAL_DEADLINE_KINDS).default('none'),
    deadlineDate: z.string().datetime().nullable().optional(),
    relativeDays: z.number().int().min(1).max(3650).nullable().optional(),
    recurringMonths: z.number().int().min(1).max(120).nullable().optional()
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
export type TPublicApiCreateCohortGoal = z.infer<typeof ZPublicApiCreateCohortGoal>;

export const ZPublicApiUpdateCohortGoal = z
  .object({
    type: z.enum(GOAL_TYPES).optional(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    courseIds: z.array(z.string().uuid()).max(50).optional(),
    requiredCount: z.number().int().min(1).max(50).nullable().optional(),
    scoreThreshold: z.number().int().min(0).max(100).nullable().optional(),
    teamPassRateThreshold: z.number().int().min(0).max(100).nullable().optional(),
    reminderDaysBefore: z.array(z.number().int().min(0).max(365)).max(5).optional(),
    deadlineKind: z.enum(GOAL_DEADLINE_KINDS).optional(),
    deadlineDate: z.string().datetime().nullable().optional(),
    relativeDays: z.number().int().min(1).max(3650).nullable().optional(),
    recurringMonths: z.number().int().min(1).max(120).nullable().optional(),
    status: z.enum(['active', 'archived']).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' });
export type TPublicApiUpdateCohortGoal = z.infer<typeof ZPublicApiUpdateCohortGoal>;
