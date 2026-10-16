import type { MetaTagsProps } from 'svelte-meta-tags';
import { error } from '@sveltejs/kit';
import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import { safeServerApi } from '$lib/utils/services/api/server';
import type {
  LearningPathDetail,
  LearningPathFaqItem,
  LearningPathInstructorItem,
  LearningPathReviewItem,
  LearningPathSeriesCourse
} from '@cio/ui/custom/org-landing-page';

type GetPublicLearningPathRequest = (typeof classroomio)['learning-path']['public'][':slug']['$get'];
type GetPublicLearningPathSuccess = Extract<InferResponseType<GetPublicLearningPathRequest>, { success: true }>;
type PublicLearningPathDetail = GetPublicLearningPathSuccess['data'];
type PublicLearningPathCourse = PublicLearningPathDetail['courses'][number];

type LandingPageContent = {
  goals?: string;
  skills?: string[];
  instructors?: Array<{
    id?: string | number;
    name?: string;
    role?: string;
    imgUrl?: string;
    avatarUrl?: string;
    description?: string;
    bio?: string;
    coursesNo?: number;
  }>;
  reviews?: Array<{
    id?: string | number;
    hide?: boolean;
    name?: string;
    avatar_url?: string;
    avatarUrl?: string;
    rating?: number;
    created_at?: string | number;
    description?: string;
  }>;
  showFaqs?: boolean;
  faqs?: Array<{ id?: string | number; question?: string; answer?: string }>;
};

/** Landing-page goals are stored as HTML paragraphs; the detail needs text items. */
function goalsToOutcomes(goals: string | undefined): string[] {
  if (!goals) return [];

  return goals
    .split(/<\/p>/i)
    .map((chunk) => chunk.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);
}

function toReviewItems(reviews: LandingPageContent['reviews']): LearningPathReviewItem[] {
  return (reviews ?? [])
    .filter((review) => !review.hide && review.name)
    .map((review, index) => ({
      id: String(review.id ?? `review-${index}`),
      name: String(review.name),
      avatarUrl: review.avatarUrl ?? review.avatar_url ?? undefined,
      rating: review.rating ?? 5,
      description: review.description ?? undefined,
      createdAt: review.created_at != null ? String(review.created_at) : undefined
    }));
}

function averageRating(reviews: LearningPathReviewItem[]): number | undefined {
  if (reviews.length === 0) return undefined;

  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function toInstructors(
  landingInstructors: LandingPageContent['instructors'],
  courses: PublicLearningPathCourse[]
): LearningPathInstructorItem[] {
  const fromLanding = (landingInstructors ?? [])
    .filter((instructor) => instructor.name)
    .map((instructor, index) => ({
      id: String(instructor.id ?? `landing-instructor-${index}`),
      name: String(instructor.name),
      role: instructor.role ?? '',
      avatarUrl: instructor.imgUrl ?? instructor.avatarUrl ?? undefined,
      bio: instructor.description ?? instructor.bio ?? undefined,
      coursesCount: instructor.coursesNo ?? undefined
    }));

  if (fromLanding.length > 0) return fromLanding;

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

function toSeriesCourse(course: PublicLearningPathCourse): LearningPathSeriesCourse {
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

function toFaqItems(faqs: LandingPageContent['faqs'], showFaqs: boolean | undefined): LearningPathFaqItem[] {
  if (!showFaqs) return [];

  return (faqs ?? [])
    .filter((faq) => faq.question && faq.answer)
    .map((faq, index) => ({
      id: String(faq.id ?? `faq-${index}`),
      question: String(faq.question),
      answer: String(faq.answer)
    }));
}

function toLearningPathDetail(
  path: PublicLearningPathDetail,
  slug: string,
  landing: LandingPageContent
): LearningPathDetail {
  const reviews = toReviewItems(landing.reviews);
  const rating = averageRating(reviews);
  const certificateDownloadable = (path.certificate as { isDownloadable?: boolean } | null)?.isDownloadable === true;

  return {
    id: path.id,
    slug,
    title: path.name,
    description: path.description ?? '',
    logo: path.coverImage ?? undefined,
    cost: path.cost ?? 0,
    currency: path.currency ?? 'USD',
    courseCount: path.courses.length,
    hasCertificate: certificateDownloadable,
    totalStudents: path.totalStudents ?? 0,
    rating,
    reviewsCount: reviews.length > 0 ? reviews.length : undefined,
    outcomes: goalsToOutcomes(landing.goals),
    skills: landing.skills ?? [],
    series: path.courses.map(toSeriesCourse),
    instructors: toInstructors(landing.instructors, path.courses),
    certificate: certificateDownloadable ? {} : null,
    reviews,
    faq: toFaqItems(landing.faqs, landing.showFaqs)
  };
}

export const load = async ({ params, parent, url }) => {
  const { isOrgSite, org } = await parent();

  if (!isOrgSite || !org) {
    throw error(404, 'Not found');
  }

  const organizationId = org.id;
  if (!organizationId) {
    throw error(404, 'Not found');
  }

  const pathResult = await safeServerApi<GetPublicLearningPathSuccess>(() =>
    classroomio['learning-path'].public[':slug'].$get({
      param: { slug: params.slug },
      query: { organizationId }
    })
  );

  if (!pathResult.ok || !pathResult.body.data) {
    throw error(404, 'Not found');
  }

  const path = pathResult.body.data;
  const landing = (path.landingPage ?? {}) as LandingPageContent;
  const detail = toLearningPathDetail(path, params.slug, landing);

  const canonicalUrl = new URL(`/learning-paths/${params.slug}`, `${url.origin}`).href;
  const pageTitle = `${detail.title} · ${org.name}`;
  const pageDescription = detail.description;

  const pageMetaTags: MetaTagsProps = Object.freeze({
    title: pageTitle,
    description: pageDescription,
    canonical: canonicalUrl,
    openGraph: {
      type: 'website',
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl
    }
  });

  return {
    org,
    detail,
    pageMetaTags
  };
};
