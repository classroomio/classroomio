/**
 * Public surface of `@cio/core`.
 *
 * Most consumers reach into the package via subpath imports (`./services/*`,
 * `./utils/*`, `./config/*` — see `package.json` exports). The top-level
 * surface is intentionally narrow: it only re-exports the durable agent
 * runner used by the BullMQ worker in `apps/jobs`.
 */

export {
  runAgentCourseGenerationJob,
  type RunAgentCourseGenerationJobInput
} from './services/agent/course-generation-runner';
