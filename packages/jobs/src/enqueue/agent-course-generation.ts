import type { JobsOptions } from 'bullmq';

import { JOB_NAMES, QUEUE_NAMES } from '../queues/names';
import { QUEUE_DEFAULTS } from '../queues/defaults';
import { getQueue } from '../queues/factories';
import type { TAgentCourseGenerationPayload } from '../payloads/agent-course-generation';

function toJobId(runId: string, attempt: number, executionKey?: string | number): string {
  const suffix = executionKey !== undefined ? `-${executionKey}` : '';
  return `agent-course-generation-${runId}-${attempt}${suffix}`;
}

export async function enqueueAgentCourseGenerationRun(
  payload: TAgentCourseGenerationPayload,
  options: { attempt: number; executionKey?: string | number } & JobsOptions
): Promise<string | undefined> {
  const { attempt, executionKey, ...jobOptions } = options;

  const job = await getQueue(QUEUE_NAMES.agentCourseGeneration).add(JOB_NAMES.agentCourseGeneration.run, payload, {
    ...QUEUE_DEFAULTS[QUEUE_NAMES.agentCourseGeneration],
    jobId: toJobId(payload.runId, attempt, executionKey ?? Date.now()),
    ...jobOptions
  });

  return job.id;
}
