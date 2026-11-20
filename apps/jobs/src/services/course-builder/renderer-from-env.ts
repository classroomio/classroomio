import { env } from '../../config/env';

import { createRenderer, type ManagedRenderer } from './renderer';

/** Same identity as the course-builder fetcher, so sites see one crawler and one robots group. */
export const COURSE_BUILDER_USER_AGENT = 'ClassroomIO-CourseBuilder/0.1 (+https://classroomio.com)';

let shared: ManagedRenderer | null = null;

/** The worker's one renderer, or `null` when the flag is off; the reader then skips pages that need scripts. */
export function rendererFromEnv(): ManagedRenderer | null {
  if (env.COURSE_BUILDER_RENDERER_ENABLED !== 'true') return null;

  const maxConcurrentPages = Number.parseInt(env.COURSE_BUILDER_RENDERER_CONCURRENCY ?? '3', 10) || 3;
  const recycleAfter = Number.parseInt(env.COURSE_BUILDER_RENDERER_RECYCLE_AFTER ?? '200', 10) || 200;
  shared ??= createRenderer({
    userAgent: COURSE_BUILDER_USER_AGENT,
    cdpEndpoint: env.COURSE_BUILDER_RENDERER_CDP_URL || undefined,
    maxConcurrentPages,
    recycleAfter
  });

  return shared;
}

export async function closeRenderer(): Promise<void> {
  const instance = shared;
  shared = null;
  await instance?.close();
}
