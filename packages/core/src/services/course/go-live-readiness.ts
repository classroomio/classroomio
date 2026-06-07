import { getCourseById } from '@cio/db/queries/course';
import { getCourseContentItems, type CourseContentItemRow } from '@cio/db/queries/course/content';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getOrganizationById } from '@cio/db/queries/organization';
import type { TCourse, TOrganization } from '@cio/db/types';
import { generateSlug } from '@cio/utils/functions';
import { ContentType } from '@cio/utils/constants';
import type { TCourseLandingPageUpdate } from '@cio/utils/validation/course';

import { AppError, ErrorCodes } from '@cio/utils/errors';
import { getDashboardBaseUrl } from '../../config/dashboard-url';
import { updateCourse } from './course';
import { ensureCourseSlug, generateUniqueCourseSlug } from './landing-page';

export type CourseGoLiveIssue = {
  code: string;
  message: string;
  target?: string;
};

export type CourseGoLiveReadiness = {
  ready: boolean;
  blockers: CourseGoLiveIssue[];
  warnings: CourseGoLiveIssue[];
  suggestedFixes: {
    slug?: string;
    landingPage?: TCourseLandingPageUpdate;
  };
  courseUrl?: string;
};

type CourseReadinessInput = {
  course: Pick<
    TCourse,
    'id' | 'title' | 'description' | 'overview' | 'slug' | 'logo' | 'bannerImage' | 'metadata' | 'type' | 'cost'
  >;
  contentItems: CourseContentItemRow[];
  suggestedSlug?: string;
  organization?: Pick<TOrganization, 'customDomain' | 'isCustomDomainVerified' | 'siteName'> | null;
};

const PLACEHOLDER_PATTERNS = [
  /\[edit me\]/i,
  /^untitled\b/i,
  /^new course$/i,
  /^course title$/i,
  /^course description$/i,
  /welcome to this amazing course/i
];

function normalizeReadableText(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMeaningfulText(value: string | null | undefined): boolean {
  const normalized = normalizeReadableText(value);

  if (normalized.length < 3) {
    return false;
  }

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}

function buildIssue(code: string, message: string, target?: string): CourseGoLiveIssue {
  return target ? { code, message, target } : { code, message };
}

function hasLessonContent(item: CourseContentItemRow): boolean {
  return Boolean(
    item.hasNoteContent || item.hasSlideContent || (item.videosCount ?? 0) > 0 || (item.documentsCount ?? 0) > 0
  );
}

function buildCourseUrl(
  organization: CourseReadinessInput['organization'],
  slug: string | null | undefined
): string | undefined {
  if (!organization || !slug) {
    return undefined;
  }

  return `${getDashboardBaseUrl(organization)}/course/${encodeURIComponent(slug)}`;
}

export function evaluateCourseGoLiveReadiness(input: CourseReadinessInput): CourseGoLiveReadiness {
  const { course, contentItems, organization, suggestedSlug } = input;
  const blockers: CourseGoLiveIssue[] = [];
  const warnings: CourseGoLiveIssue[] = [];
  const landingPageFixes: TCourseLandingPageUpdate = {};
  const metadataFixes: NonNullable<TCourseLandingPageUpdate['metadata']> = {};

  if (!hasMeaningfulText(course.title)) {
    blockers.push(buildIssue('COURSE_TITLE_MISSING', 'Add a clear course title.', 'course.title'));
  }

  if (!hasMeaningfulText(course.description)) {
    blockers.push(buildIssue('COURSE_DESCRIPTION_MISSING', 'Add a clear course description.', 'course.description'));
  }

  if (!course.slug && !suggestedSlug) {
    blockers.push(buildIssue('COURSE_SLUG_MISSING', 'Generate a public course slug.', 'course.slug'));
  }

  if (!hasMeaningfulText(course.overview)) {
    blockers.push(buildIssue('LANDING_OVERVIEW_MISSING', 'Add a landing-page overview.', 'course.overview'));
    landingPageFixes.overview = '';
  }

  if (!hasMeaningfulText(course.metadata?.description)) {
    blockers.push(
      buildIssue('LANDING_DESCRIPTION_MISSING', 'Add a landing-page description.', 'course.metadata.description')
    );
    metadataFixes.description = '';
  }

  if (!hasMeaningfulText(course.metadata?.goals)) {
    blockers.push(
      buildIssue('LANDING_GOALS_MISSING', 'Add course goals for the landing page.', 'course.metadata.goals')
    );
    metadataFixes.goals = '';
  }

  if (!hasMeaningfulText(course.metadata?.requirements)) {
    blockers.push(
      buildIssue(
        'LANDING_REQUIREMENTS_MISSING',
        'Add course requirements for the landing page.',
        'course.metadata.requirements'
      )
    );
    metadataFixes.requirements = '';
  }

  if (!course.logo && !course.bannerImage) {
    blockers.push(buildIssue('LANDING_IMAGE_MISSING', 'Add a landing-page banner or course image.', 'course.logo'));
    landingPageFixes.generateImage = true;
  }

  const learningItems = contentItems.filter(
    (item) => item.type === ContentType.Lesson || item.type === ContentType.Exercise
  );

  if (learningItems.length === 0) {
    blockers.push(buildIssue('COURSE_CONTENT_MISSING', 'Add at least one lesson or exercise.', 'course.content'));
  }

  for (const item of contentItems) {
    if (item.type === ContentType.Lesson && !hasLessonContent(item)) {
      blockers.push(
        buildIssue(
          'LESSON_CONTENT_EMPTY',
          `Add content to lesson "${item.title ?? 'Untitled lesson'}".`,
          `lesson:${item.id}`
        )
      );
    }

    if (item.type === ContentType.Exercise && (item.questionCount ?? 0) === 0) {
      blockers.push(
        buildIssue(
          'EXERCISE_QUESTIONS_MISSING',
          `Add at least one question to exercise "${item.title ?? 'Untitled exercise'}".`,
          `exercise:${item.id}`
        )
      );
    }
  }

  if (!hasMeaningfulText(course.metadata?.instructor?.name)) {
    warnings.push(
      buildIssue('INSTRUCTOR_MISSING', 'Add instructor information for more trust.', 'course.metadata.instructor')
    );
  }

  if (!course.metadata?.reviews?.some((review) => !review.hide && hasMeaningfulText(review.description))) {
    warnings.push(
      buildIssue('REVIEWS_MISSING', 'Add testimonials or reviews when available.', 'course.metadata.reviews')
    );
  }

  if ((course.cost ?? 0) > 0 && !hasMeaningfulText(course.metadata?.paymentLink)) {
    warnings.push(
      buildIssue('PAYMENT_LINK_MISSING', 'Add a payment link for this paid course.', 'course.metadata.paymentLink')
    );
  }

  if (course.type === 'COMPLIANCE') {
    warnings.push(
      buildIssue('COMPLIANCE_REVIEW_RECOMMENDED', 'Review compliance settings before publishing.', 'course.compliance')
    );
  }

  if (Object.keys(metadataFixes).length > 0) {
    landingPageFixes.metadata = metadataFixes;
  }

  const suggestedFixes: CourseGoLiveReadiness['suggestedFixes'] = {};
  if (!course.slug && suggestedSlug) {
    suggestedFixes.slug = suggestedSlug;
  }

  if (Object.keys(landingPageFixes).length > 0) {
    suggestedFixes.landingPage = landingPageFixes;
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    suggestedFixes,
    courseUrl: buildCourseUrl(organization, course.slug ?? suggestedSlug)
  };
}

export async function getCourseGoLiveReadiness(courseId: string): Promise<CourseGoLiveReadiness> {
  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const organizationId = await getCourseOrganizationId(courseId);
  const [contentItems, organization] = await Promise.all([
    getCourseContentItems(courseId),
    organizationId ? getOrganizationById(organizationId) : Promise.resolve(null)
  ]);

  const suggestedSlug = course.slug
    ? undefined
    : await generateUniqueCourseSlug(generateSlug(course.title, { fallback: 'course' }));

  return evaluateCourseGoLiveReadiness({
    course,
    contentItems,
    suggestedSlug,
    organization
  });
}

export async function publishCourseWhenReady(courseId: string) {
  const readiness = await getCourseGoLiveReadiness(courseId);
  if (!readiness.ready) {
    const blockerList = readiness.blockers.map((blocker) => blocker.message).join(' ');
    throw new AppError(`Course is not ready to go live. ${blockerList}`, 'COURSE_GO_LIVE_BLOCKED', 400);
  }

  const [course] = await getCourseById(courseId);
  if (!course) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const slug = await ensureCourseSlug(courseId, course.title);
  const publishedCourse = await updateCourse(courseId, { slug, isPublished: true });
  const publishedReadiness = await getCourseGoLiveReadiness(courseId);

  return {
    course: publishedCourse,
    readiness: publishedReadiness
  };
}
