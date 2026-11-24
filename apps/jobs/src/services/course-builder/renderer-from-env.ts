import { env } from '../../config/env';
import { log } from '../../utils/logger';

import { createRenderer, type ManagedRenderer } from './renderer';

/** Same identity as the course-builder fetcher, so sites see one crawler and one robots group. */
export const COURSE_BUILDER_USER_AGENT = 'ClassroomIO-CourseBuilder/0.1 (+https://classroomio.com)';
const DEFAULT_CONCURRENT_PAGES = 3;

let shared: Promise<ManagedRenderer | null> | null = null;

async function openRenderer(): Promise<ManagedRenderer | null> {
  const maxConcurrentPages =
    Number.parseInt(env.COURSE_BUILDER_RENDERER_CONCURRENCY ?? '', 10) || DEFAULT_CONCURRENT_PAGES;
  const renderer = createRenderer({
    userAgent: COURSE_BUILDER_USER_AGENT,
    cdpEndpoint: env.COURSE_BUILDER_RENDERER_CDP_URL || undefined,
    maxConcurrentPages
  });
  if (await renderer.available()) return renderer;

  log.warn('course builder: no headless browser, so pages that are empty until their scripts run are skipped', {
    cdpEndpoint: Boolean(env.COURSE_BUILDER_RENDERER_CDP_URL)
  });
  await renderer.close();

  return null;
}

/**
 * The worker's one renderer: the hosted browser at `COURSE_BUILDER_RENDERER_CDP_URL`, else a local headless Chromium.
 * Checked once, on the first build; `null` when neither is there, and the reader then skips pages that need scripts.
 */
export function rendererFromEnv(): Promise<ManagedRenderer | null> {
  shared ??= openRenderer();

  return shared;
}

export async function closeRenderer(): Promise<void> {
  const pending = shared;
  shared = null;
  const instance = await pending;
  await instance?.close();
}
