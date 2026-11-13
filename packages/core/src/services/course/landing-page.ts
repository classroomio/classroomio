import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TCourse, TOrganization } from '@cio/db/types';
import {
  validatePaidCourseState,
  type TCourseLandingPageMetadataUpdate,
  type TCourseLandingPageUpdate
} from '@cio/utils/validation/course';

import { env } from '../../config/env';
import { generateSlug } from '@cio/utils/functions';
import { getCourseById, isCourseSlugTaken, updateCourseSlug } from '@cio/db/queries/course';
import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { getAppBaseUrl, getDashboardBaseUrl } from '../../config/dashboard-url';
import { getOrganizationById } from '@cio/db/queries/organization';
import { updateCourse } from './course';

type CourseLandingPageUpdateResult = {
  course: TCourse;
  courseUrl: string;
  bannerImageUrl: string | null;
};

export async function generateUniqueCourseSlug(baseSlug: string): Promise<string> {
  let suffix = 0;
  let candidate = baseSlug;

  while (true) {
    const taken = await isCourseSlugTaken(candidate);
    if (!taken) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

export async function ensureCourseSlug(courseId: string, title: string | null | undefined): Promise<string> {
  const [course] = await getCourseById(courseId);
  if (course?.slug) {
    return course.slug;
  }

  const baseSlug = generateSlug(title, { fallback: 'course' });
  const uniqueSlug = await generateUniqueCourseSlug(baseSlug);
  const updated = await updateCourseSlug(courseId, uniqueSlug);

  if (!updated) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  return updated.slug ?? uniqueSlug;
}

export async function resolveCourseUrl(organizationId: string, courseId: string, title: string) {
  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', ErrorCodes.ORG_NOT_FOUND, 404);
  }

  const slug = await ensureCourseSlug(courseId, title);
  return `${getDashboardBaseUrl(organization)}/course/${encodeURIComponent(slug)}`;
}

export type CourseBannerOutcome = {
  applied: boolean;
  imageUrl: string | null;
  source: 'provided' | 'unsplash' | null;
  reason: 'not_requested' | 'unsplash_not_configured' | 'no_image_found' | 'lookup_failed' | null;
};

export type CourseLinks = {
  appUrl: string;
  landingPageUrl: string | null;
};

/**
 * Picks a banner image from an explicit URL or an Unsplash search, and reports why none was chosen.
 * Never throws: a failed lookup yields `applied: false` so course creation is not blocked by it.
 */
export async function resolveCourseBanner(
  courseTitle: string,
  options: { bannerImageUrl?: string; generateBannerImage?: boolean; bannerImageQuery?: string }
): Promise<CourseBannerOutcome> {
  if (options.bannerImageUrl) {
    return { applied: true, imageUrl: options.bannerImageUrl, source: 'provided', reason: null };
  }

  if (!options.generateBannerImage && !options.bannerImageQuery) {
    return { applied: false, imageUrl: null, source: null, reason: 'not_requested' };
  }

  if (!env.UNSPLASH_API_KEY) {
    return { applied: false, imageUrl: null, source: null, reason: 'unsplash_not_configured' };
  }

  try {
    const imageUrl = await resolveUnsplashBannerImage(courseTitle, options.bannerImageQuery);
    if (!imageUrl) {
      return { applied: false, imageUrl: null, source: null, reason: 'no_image_found' };
    }

    return { applied: true, imageUrl, source: 'unsplash', reason: null };
  } catch (error) {
    console.error('resolveCourseBanner error:', error);
    return { applied: false, imageUrl: null, source: null, reason: 'lookup_failed' };
  }
}

/**
 * `appUrl` is the staff dashboard page for the course and works at any time; `landingPageUrl` is the public page
 * and is null until the course is published.
 */
export async function buildCourseLinks(
  organizationId: string,
  course: Pick<TCourse, 'id' | 'title' | 'isPublished'>
): Promise<CourseLinks> {
  const appUrl = `${getAppBaseUrl()}/courses/${course.id}`;
  if (!course.isPublished) {
    return { appUrl, landingPageUrl: null };
  }

  const landingPageUrl = await resolveCourseUrl(organizationId, course.id, course.title);
  return { appUrl, landingPageUrl };
}

export async function resolveUnsplashBannerImage(courseTitle: string, query?: string) {
  if (!env.UNSPLASH_API_KEY) {
    return null;
  }

  const searchQuery = (query?.trim() || courseTitle.trim() || 'education').slice(0, 120);
  const response = await fetch(
    `https://api.unsplash.com/search/photos?page=1&per_page=15&auto=format&fit=crop&w=2970&q=80&client_id=${env.UNSPLASH_API_KEY}&query=${encodeURIComponent(searchQuery)}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    results?: Array<{
      urls?: {
        regular?: string;
      };
    }>;
  };

  const photos = data.results ?? [];
  if (photos.length === 0) {
    return null;
  }

  const photo = photos[Math.floor(Math.random() * photos.length)];
  return photo?.urls?.regular ?? null;
}

async function resolveLandingPageImage(
  courseTitle: string,
  payload: Pick<TCourseLandingPageUpdate, 'generateImage' | 'imageQuery' | 'imageUrl'>
) {
  if (payload.imageUrl) {
    return payload.imageUrl;
  }

  if (!payload.generateImage && !payload.imageQuery) {
    return null;
  }

  try {
    return await resolveUnsplashBannerImage(courseTitle, payload.imageQuery);
  } catch (error) {
    console.error('resolveLandingPageImage error:', error);
    return null;
  }
}

function mergeLandingPageMetadata(
  existing: TCourse['metadata'] | null | undefined,
  update: TCourseLandingPageMetadataUpdate | undefined
): TCourse['metadata'] | undefined {
  if (!update) {
    return existing ?? undefined;
  }

  const current: NonNullable<TCourse['metadata']> = {
    goals: '',
    description: '',
    requirements: '',
    ...(existing ?? {})
  };

  return {
    ...current,
    ...update,
    reward: update.reward
      ? {
          show: update.reward.show ?? current.reward?.show ?? false,
          description: update.reward.description ?? current.reward?.description ?? ''
        }
      : current.reward,
    instructor: update.instructor
      ? {
          name: update.instructor.name ?? current.instructor?.name ?? '',
          role: update.instructor.role ?? current.instructor?.role ?? '',
          coursesNo: update.instructor.coursesNo ?? current.instructor?.coursesNo ?? 0,
          description: update.instructor.description ?? current.instructor?.description ?? '',
          imgUrl: update.instructor.imgUrl ?? current.instructor?.imgUrl ?? ''
        }
      : current.instructor,
    certificate: update.certificate
      ? {
          templateUrl: update.certificate.templateUrl ?? current.certificate?.templateUrl ?? ''
        }
      : current.certificate,
    sectionDisplay: update.sectionDisplay
      ? { ...(current.sectionDisplay ?? {}), ...update.sectionDisplay }
      : current.sectionDisplay,
    reviews: update.reviews ?? current.reviews,
    lessonTabsOrder: update.lessonTabsOrder ?? current.lessonTabsOrder
  };
}

function normalizeReviews(reviews: NonNullable<TCourse['metadata']>['reviews'] | undefined) {
  return reviews?.map((review, index) => ({
    id: review.id ?? Date.now() + index,
    hide: review.hide ?? false,
    name: review.name,
    avatar_url: review.avatar_url,
    rating: review.rating,
    created_at: review.created_at ?? Date.now(),
    description: review.description
  }));
}

export async function updateCourseLandingPageService(
  courseId: string,
  payload: TCourseLandingPageUpdate
): Promise<CourseLandingPageUpdateResult> {
  const [existingCourse] = await getCourseById(courseId);
  if (!existingCourse) {
    throw new AppError('Course not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const nextTitle = payload.title ?? existingCourse.title;
  const metadata = mergeLandingPageMetadata(existingCourse.metadata ?? undefined, payload.metadata);

  const nextCost = payload.cost === undefined ? (existingCourse.cost ?? 0) : (payload.cost ?? 0);
  const paidCourseIssue = validatePaidCourseState(nextCost, metadata)[0];
  if (paidCourseIssue) {
    throw new AppError(paidCourseIssue.message, ErrorCodes.VALIDATION_ERROR, 400);
  }

  const imageUrl = await resolveLandingPageImage(nextTitle, payload);

  const { course: updatedCourse } = await updateCourse(courseId, {
    title: payload.title,
    description: payload.description,
    overview: payload.overview,
    cost: payload.cost,
    currency: payload.currency,
    metadata: metadata
      ? {
          ...metadata,
          reviews: normalizeReviews(metadata.reviews)
        }
      : undefined,
    ...(imageUrl ? { bannerImage: imageUrl } : {})
  });

  const organizationId = await getCourseOrganizationId(courseId);
  if (!organizationId) {
    throw new AppError('Course organization not found', ErrorCodes.COURSE_NOT_FOUND, 404);
  }

  const courseUrl = await resolveCourseUrl(organizationId, courseId, updatedCourse.title);

  return {
    course: updatedCourse,
    courseUrl,
    bannerImageUrl: updatedCourse.bannerImage || imageUrl || null
  };
}
