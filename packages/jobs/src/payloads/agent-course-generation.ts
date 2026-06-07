import * as z from 'zod';

/**
 * Payload for long-running AI course-generation runs.
 *
 * The worker re-loads the full run from Postgres by id. Keep the queue payload
 * tiny so retries always use the latest durable run state and checkpoints.
 */
export const ZAgentCourseGenerationPayload = z.object({
  runId: z.string().uuid(),
  requestedByUserId: z.string().uuid(),
  organizationId: z.string().uuid()
});

export type TAgentCourseGenerationPayload = z.infer<typeof ZAgentCourseGenerationPayload>;
