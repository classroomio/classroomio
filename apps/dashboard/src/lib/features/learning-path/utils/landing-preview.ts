import type {
  LearningPathDetail as LearningPathPreviewDetail,
  LearningPathFaqItem,
  LearningPathInstructorItem,
  LearningPathReviewItem,
  LearningPathSeriesCourse
} from '@cio/ui/custom/org-landing-page';
import type { TLandingPage } from '@cio/utils/validation/learning-path';
import type { LearningPathDetail } from './types';

type AdminPathCourse = LearningPathDetail['courses'][number];

/**
 * Builds the public detail shape from the saved path plus the editor's
 * unsaved draft, so the landing-page preview renders exactly what the
 * org-site page will show after save. Mirrors the mapping in
 * routes/(org-site)/learning-paths/[slug]/+page.server.ts — keep the two in
 * sync when either changes.
 */
export function buildDraftLearningPathDetail(
  path: LearningPathDetail,
  draft: TLandingPage,
  cost: number,
  currency: string
): LearningPathPreviewDetail {
  const slug = path.slug ?? path.publicId ?? path.id;
  const reviews = toReviewItems(draft.reviews);
  const rating = averageRating(reviews);
  const certificateDownloadable = (path.certificate as { isDownloadable?: boolean } | null)?.isDownloadable === true;
  const showCertificate = draft.showCertificate !== false;

  return {
    id: path.id,
    slug,
    title: draft.title || path.name,
    description: draft.description || path.description || '',
    logo: path.coverImage ?? undefined,
    cost,
    currency,
    courseCount: path.courses.length,
    hasCertificate: certificateDownloadable && showCertificate,
    totalStudents: path.totalStudents ?? 0,
    rating,
    reviewsCount: reviews.length > 0 ? reviews.length : undefined,
    outcomes: goalsToOutcomes(draft.goals),
    skills: draft.skills ?? [],
    series: path.courses.map(toSeriesCourse),
    instructors: toInstructors(draft.instructors, path.courses),
    certificate: certificateDownloadable && showCertificate ? {} : null,
    reviews,
    faq: toFaqItems(draft.faqs, draft.showFaqs),
    paymentEnabled: draft.paymentEnabled,
    metadata:
      draft.showDiscount || draft.discount != null
        ? { discount: draft.discount, showDiscount: draft.showDiscount }
        : undefined,
    pricing: {
      cost,
      currency,
      ctaHref: `/learning-paths/${slug}/enroll`
    }
  };
}

function goalsToOutcomes(goals: string | undefined): string[] {
  if (!goals) return [];

  return goals
    .split(/<\/p>/i)
    .map((chunk) => chunk.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);
}

type DraftReview = NonNullable<TLandingPage['reviews']>[number];

function toReviewItems(reviews: TLandingPage['reviews']): LearningPathReviewItem[] {
  return (reviews ?? [])
    .filter((review) => !review.hide && review.name)
    .map((review: DraftReview, index: number) => ({
      id: String(review.id ?? `review-${index}`),
      name: String(review.name),
      avatarUrl: review.avatar_url ?? undefined,
      rating: review.rating ?? 5,
      description: review.description ?? undefined,
      createdAt: undefined
    }));
}

function averageRating(reviews: LearningPathReviewItem[]): number | undefined {
  if (reviews.length === 0) return undefined;

  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

type DraftInstructor = NonNullable<TLandingPage['instructors']>[number];

function toInstructors(
  landingInstructors: TLandingPage['instructors'],
  courses: AdminPathCourse[]
): LearningPathInstructorItem[] {
  const fromDraft = (landingInstructors ?? [])
    .filter((instructor) => instructor.name)
    .map((instructor: DraftInstructor, index: number) => ({
      id: String(instructor.id ?? `draft-instructor-${index}`),
      name: String(instructor.name),
      role: instructor.role ?? '',
      avatarUrl: instructor.imgUrl ?? undefined,
      bio: instructor.description ?? undefined,
      coursesCount: typeof instructor.coursesNo === 'number' ? instructor.coursesNo : undefined
    }));

  if (fromDraft.length > 0) return fromDraft;

  const seen = new Set<string>();
  const fromCourses: LearningPathInstructorItem[] = [];
  for (const course of courses) {
    const instructor = course.instructor;
    if (!instructor?.name || seen.has(instructor.name)) continue;

    seen.add(instructor.name);
    fromCourses.push({
      id: `course-instructor-${fromCourses.length}`,
      name: instructor.name,
      role: instructor.role ?? '',
      avatarUrl: instructor.imgUrl ?? undefined
    });
  }

  return fromCourses;
}

function toSeriesCourse(course: AdminPathCourse): LearningPathSeriesCourse {
  return {
    id: course.courseId,
    slug: course.courseId,
    title: course.title,
    description: course.description ?? '',
    outcomes: [],
    lessonOutlines: [],
    courseCount: 1,
    lessonCount: course.lessonsCount ?? 0,
    exerciseCount: course.exercisesCount ?? 0,
    logo: course.coverImage ?? undefined,
    cost: course.cost ?? 0,
    currency: course.currency ?? 'USD'
  };
}

function toFaqItems(faqs: TLandingPage['faqs'], showFaqs: boolean | undefined): LearningPathFaqItem[] {
  if (!showFaqs) return [];

  return (faqs ?? [])
    .filter((faq) => faq.question && faq.answer)
    .map((faq, index) => ({
      id: String(faq.id ?? `faq-${index}`),
      question: String(faq.question),
      answer: String(faq.answer)
    }));
}
