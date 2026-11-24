import * as z from 'zod';

export const COURSE_BUILD_QUEUE_STAGES = [
  'discover',
  'read',
  'understand',
  'plan',
  'write',
  'finish',
  'export'
] as const;
export type TCourseBuildQueueStage = (typeof COURSE_BUILD_QUEUE_STAGES)[number];

/**
 * Payload of every course build stage. The worker re-loads the rows from Postgres: `sourceId` names the source a read
 * job reads, `courseBuildCourseId` the course a write, finish or export job works on.
 */
export const ZCourseBuildStagePayload = z.object({
  jobId: z.string().uuid(),
  organizationId: z.string().uuid(),
  sourceId: z.string().uuid().optional(),
  courseBuildCourseId: z.string().uuid().optional()
});

export type TCourseBuildStagePayload = z.infer<typeof ZCourseBuildStagePayload>;
