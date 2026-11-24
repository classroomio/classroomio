import type { CourseBuildCourse, CourseBuildSource, CourseBuildSummary } from './types';

/** How often a page re-reads a running build: builds take minutes, so a few seconds is plenty. */
export const COURSE_BUILD_POLL_INTERVAL_MS = 5_000;

export function isCourseBuildActive(build: Pick<CourseBuildSummary, 'status'> | null | undefined): boolean {
  return build?.status === 'PENDING' || build?.status === 'RUNNING';
}

/** How long a build that ended with nothing, or failed, keeps its card on the Courses page. */
const STOPPED_CARD_TTL_MS = 24 * 60 * 60 * 1_000;

/**
 * Whether the Courses page shows the build's card. A running build always does; one that ended with nothing to build or
 * failed keeps it for a day, so the person can read why instead of watching the card vanish mid-read.
 */
export function showsCourseBuildCard(build: CourseBuildSummary | null | undefined, now = Date.now()): boolean {
  if (!build) return false;
  if (isCourseBuildActive(build)) return true;
  if (build.status !== 'NOTHING_TO_BUILD' && build.status !== 'FAILED' && build.status !== 'CANCELED') return false;

  const endedAt = Date.parse(build.finishedAt ?? build.createdAt);

  return Number.isFinite(endedAt) && now - endedAt < STOPPED_CARD_TTL_MS;
}

/** The card's one-line body: what it is doing, or why it stopped without courses. */
export function courseBuildCardBodyKey(build: CourseBuildSummary): string {
  if (isCourseBuildActive(build)) return 'course_build.card_body';
  if (build.status === 'NOTHING_TO_BUILD') return gateReasonKey(build.gateReason);

  return 'course_build.failed_body';
}

const SOURCE_KIND_KEYS: Record<string, string> = {
  'product-site': 'course_build.source_kind.product_site',
  'help-center': 'course_build.source_kind.help_center',
  docs: 'course_build.source_kind.docs',
  academy: 'course_build.source_kind.academy',
  community: 'course_build.source_kind.community'
};

export function sourceKindKey(kind: string): string {
  return SOURCE_KIND_KEYS[kind] ?? 'course_build.source_kind.other';
}

/** The host and path of a source, without the scheme or a trailing slash. */
export function sourceLabel(source: Pick<CourseBuildSource, 'url'>): string {
  return source.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export type CourseProgress =
  | { key: 'course_build.course_status.planned' }
  | { key: 'course_build.course_status.writing'; current: number; total: number }
  | { key: 'course_build.course_status.checking' }
  | { key: 'course_build.course_status.ready' }
  | { key: 'course_build.course_status.failed' };

export function courseProgress(course: CourseBuildCourse): CourseProgress {
  switch (course.status) {
    case 'WRITING':
      return {
        key: 'course_build.course_status.writing',
        current: Math.min(course.sectionsWritten + 1, Math.max(course.sectionsTotal, 1)),
        total: course.sectionsTotal
      };
    case 'CHECKING':
    case 'EXPORTING':
      return { key: 'course_build.course_status.checking' };
    case 'READY':
      return { key: 'course_build.course_status.ready' };
    case 'FAILED':
      return { key: 'course_build.course_status.failed' };
    default:
      return { key: 'course_build.course_status.planned' };
  }
}

export type PlanningStep =
  | { key: 'course_build.planning_step.understand'; pages: number }
  | { key: 'course_build.planning_step.plan' };

/**
 * The step a running build is on between reading its last page and listing its first course, which takes minutes: null
 * while a source is still being read, once courses exist, or when the build has stopped.
 */
export function planningStep(build: CourseBuildSummary): PlanningStep | null {
  if (!isCourseBuildActive(build) || build.courses.length || !build.sources.length) return null;
  if (build.sources.some((source) => source.status !== 'READ' && source.status !== 'FAILED')) return null;
  if (build.stage === 'plan') return { key: 'course_build.planning_step.plan' };

  const pages = build.sources.reduce((total, source) => total + source.pagesRead, 0);

  return { key: 'course_build.planning_step.understand', pages };
}

/** The heading key for where a build stands: reading, planning, writing, done, or nothing to build. */
export function buildHeadingKey(build: CourseBuildSummary): string {
  if (build.status === 'NOTHING_TO_BUILD') return 'course_build.heading.nothing';
  if (build.status === 'FAILED' || build.status === 'CANCELED') return 'course_build.heading.failed';
  if (build.status === 'COMPLETED') return 'course_build.heading.done';
  if (build.courses.length) return 'course_build.heading.writing';
  if (build.stage === 'understand' || build.stage === 'plan' || planningStep(build)) {
    return 'course_build.heading.planning';
  }

  return 'course_build.heading.reading';
}

/**
 * The sentence that explains a build which stopped with nothing to build: each gate reason sends the person to a
 * different fix, so a site with no documentation must not read like a site that blocks us.
 */
export function gateReasonKey(reason: string | null): string {
  switch (reason) {
    case 'no-sources':
      return 'course_build.gate.no_sources';
    case 'all-sources-blocked':
      return 'course_build.gate.blocked';
    case 'login-only':
      return 'course_build.gate.login';
    case 'too-few-pages':
      return 'course_build.gate.too_few_pages';
    case 'too-few-words':
      return 'course_build.gate.too_few_words';
    default:
      return 'course_build.nothing_body';
  }
}

/** Ids of the build's courses that are already created in the workspace. */
export function readyCourseIds(build: CourseBuildSummary): Set<string> {
  return new Set(build.courses.filter((course) => course.status === 'READY').map((course) => course.id));
}
