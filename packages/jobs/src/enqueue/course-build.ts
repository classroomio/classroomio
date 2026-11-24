import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES, type QueueName } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TCourseBuildQueueStage, TCourseBuildStagePayload } from '../payloads/course-build';

export const COURSE_BUILD_QUEUES: Record<TCourseBuildQueueStage, QueueName> = {
  discover: QUEUE_NAMES.courseBuildDiscover,
  read: QUEUE_NAMES.courseBuildRead,
  understand: QUEUE_NAMES.courseBuildUnderstand,
  plan: QUEUE_NAMES.courseBuildPlan,
  write: QUEUE_NAMES.courseBuildWrite,
  finish: QUEUE_NAMES.courseBuildFinish,
  export: QUEUE_NAMES.courseBuildExport
};

/**
 * Enqueues one stage of a course build. The BullMQ job id names the stage and its item, so a stage enqueued twice (two
 * reads finishing at once both starting the next stage) runs once.
 */
export async function enqueueCourseBuildStage(
  stage: TCourseBuildQueueStage,
  payload: TCourseBuildStagePayload,
  options: JobsOptions = {}
): Promise<string | undefined> {
  const queueName = COURSE_BUILD_QUEUES[stage];
  const item = payload.sourceId ?? payload.courseBuildCourseId ?? 'job';
  const job = await getQueue(queueName).add(JOB_NAMES.courseBuild.run, payload, {
    ...QUEUE_DEFAULTS[queueName],
    jobId: `course-build-${stage}-${payload.jobId}-${item}`,
    ...options
  });

  return job.id;
}
