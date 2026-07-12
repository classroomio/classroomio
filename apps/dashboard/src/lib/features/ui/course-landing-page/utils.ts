import type { Course, CourseContentItem } from '$features/course/utils/types';
import { NAV_ITEMS, NAV_ITEM_KEY } from './constants';

import { ContentType } from '@cio/utils/constants/content';
import type { Review } from '$features/course/utils/types';
import get from 'lodash/get';
import type { AccountOrg } from '$features/app/types';
import { normalizeLandingPageSettings } from '$features/org/utils/landing-page';
import type { CourseLandingPageProps, OrgLandingPageTheme } from '@cio/ui/custom/org-landing-page';
import { calcCourseDiscount, isCourseFree } from '$lib/utils/functions/course';
import { t } from '$lib/utils/functions/translations';

export type LandingPageLesson = {
  id: string;
  title: string | null;
  order?: number | null;
  createdAt?: string | null;
};

export type LandingPageSection = {
  id: string;
  title: string | null;
  lessons: LandingPageLesson[];
  exerciseCount: number;
};

function sortLessons(lessons: LandingPageLesson[]): LandingPageLesson[] {
  return [...lessons]
    .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getLessonsFromItems(items: CourseContentItem[]): LandingPageLesson[] {
  const lessonItems = items.filter((item) => item.type === ContentType.Lesson);
  const lessons = lessonItems.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    order: lesson.order ?? null,
    createdAt: lesson.createdAt ?? null
  }));

  return lessons;
}

function getExerciseCountFromItems(items: CourseContentItem[]): number {
  return items.filter((item) => item.type === ContentType.Exercise).length;
}

export function getCourseLessons(course: Course): LandingPageLesson[] {
  if (!course?.content) return [];

  if (course.content.grouped) {
    const groupedLessons = course.content.sections.flatMap((section) => getLessonsFromItems(section.items));
    return sortLessons(groupedLessons);
  }

  if (!course.content.items.length) return [];
  return getLessonsFromItems(course.content.items);
}

export function getCourseSections(course: Course): LandingPageSection[] {
  if (!course?.content) return [];

  if (course.content.grouped) {
    return course.content.sections.map((section) => {
      const lessons = getLessonsFromItems(section.items);
      return {
        id: section.id,
        title: section.title ?? course.title ?? 'Lessons',
        lessons,
        exerciseCount: getExerciseCountFromItems(section.items)
      };
    });
  }

  if (!course.content.items.length) return [];

  return [
    {
      id: 'ungrouped',
      title: course.title ?? 'Lessons',
      lessons: getLessonsFromItems(course.content.items),
      exerciseCount: getExerciseCountFromItems(course.content.items)
    }
  ];
}

export function getTotalLessons(sections: LandingPageSection[]) {
  return sections.reduce((total, section) => {
    return total + section.lessons.length;
  }, 0);
}

export function filterNavItems(course: Course, reviews: Review[]) {
  const rules = get(course, 'metadata.sectionDisplay', {});

  return NAV_ITEMS.filter((item) => {
    const key = item.key;

    if (typeof rules[key] === 'boolean') {
      return !!rules[key];
    }

    if (key === NAV_ITEM_KEY.REVIEWS) {
      // Show only if there are reviews added
      return reviews.length > 0;
    }

    // In case they are undefined
    return true;
  });
}

export function buildCourseLandingPageProps(
  course: Course,
  org: AccountOrg,
  options: {
    enrollHref: string;
    enrollDisabled: boolean;
    authAction?: { label: string; href: string };
    onPaidEnrollClick?: (event: MouseEvent) => void;
  }
): CourseLandingPageProps {
  const landing = normalizeLandingPageSettings(org.landingpage);
  const metadata = course.metadata ?? null;
  const reviewsRaw = (metadata?.reviews ?? []) as NonNullable<NonNullable<Course['metadata']>['reviews']>;
  const reviewsVisible = reviewsRaw.filter((r) => !r?.hide);

  const sectionDisplay = (metadata?.sectionDisplay ?? {}) as Record<string, boolean>;
  const isVisible = (key: string, fallback = true) =>
    typeof sectionDisplay[key] === 'boolean' ? sectionDisplay[key] : fallback;

  const sections = getCourseSections(course);
  const totalLessons = getTotalLessons(sections);

  const averageRating =
    reviewsVisible.length > 0
      ? reviewsVisible.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsVisible.length
      : undefined;

  const hasCertificate = Boolean(metadata?.certificate?.templateUrl || course.certificate?.design?.templateId);

  const courseTypeLabel =
    course.type === 'LIVE_CLASS' ? 'Live class' : course.type === 'COMPLIANCE' ? 'Compliance' : 'Self-paced';

  const includeRequirement = isVisible(NAV_ITEM_KEY.REQUIREMENT) && Boolean(metadata?.requirements);
  const includeDescription = isVisible(NAV_ITEM_KEY.DESCRIPTION) && Boolean(metadata?.description);
  const includeGoals = isVisible(NAV_ITEM_KEY.GOALS) && Boolean(metadata?.goals);
  const includeCertificate = isVisible(NAV_ITEM_KEY.CERTIFICATE) && Boolean(metadata?.certificate?.templateUrl);
  const includeReviews = isVisible(NAV_ITEM_KEY.REVIEWS, reviewsVisible.length > 0);
  const includeInstructor = isVisible(NAV_ITEM_KEY.INSTRUCTOR);

  const instructor = (metadata?.instructor ?? {}) as NonNullable<Course['metadata']>['instructor'] & {
    name?: string;
    role?: string;
    description?: string;
    imgUrl?: string;
    coursesNo?: number;
  };

  const stats = [
    { label: 'Lessons', value: totalLessons.toString() },
    averageRating !== undefined ? { label: 'Rating', value: averageRating.toFixed(1) } : null,
    hasCertificate ? { label: 'Certificate', value: 'Included' } : null
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const discount = metadata?.discount ?? 0;
  const showDiscount = metadata?.showDiscount ?? false;
  const calculatedCost = calcCourseDiscount(discount, course.cost ?? 0, !!showDiscount);
  const isFree = isCourseFree(calculatedCost);
  const pricingCtaLabel = isFree
    ? t.get('course.navItem.landing_page.pricing_section.enroll')
    : t.get('course.navItem.landing_page.pricing_section.buy');
  const paidEnrollClick = !isFree && !options.enrollDisabled ? options.onPaidEnrollClick : undefined;

  return {
    theme: landing.theme as OrgLandingPageTheme,
    orgName: org.name ?? '',
    logoUrl: org.avatarUrl ?? undefined,
    navItems: landing.navItems,
    authAction: options.authAction,
    hero: {
      heading: course.title ?? landing.hero.heading,
      subheading: course.description ?? landing.hero.subheading,
      primaryAction: {
        label: pricingCtaLabel,
        href: paidEnrollClick ? undefined : options.enrollHref,
        onclick: paidEnrollClick,
        disabled: options.enrollDisabled
      },
      secondaryAction: { label: 'View curriculum', href: '#curriculum' },
      image: course.logo || undefined,
      stats
    },
    socialProof: {
      rating: averageRating,
      lessons: totalLessons > 0 ? totalLessons : undefined,
      type: courseTypeLabel,
      hasCertificate
    },
    info: {
      requirements: includeRequirement ? (metadata?.requirements ?? undefined) : undefined,
      description: includeDescription ? (metadata?.description ?? undefined) : undefined,
      goals: includeGoals ? (metadata?.goals ?? undefined) : undefined,
      certificateUrl: includeCertificate ? metadata?.certificate?.templateUrl : undefined
    },
    curriculum: {
      grouped: course.content?.grouped ?? false,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title ?? 'Lessons',
        lessons: section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title ?? 'Untitled lesson'
        })),
        exerciseCount: section.exerciseCount
      }))
    },
    chips: {
      skills: metadata?.skills ?? undefined,
      tools: metadata?.tools ?? undefined
    },
    instructor: includeInstructor
      ? {
          name: instructor.name?.trim() || org.name || '',
          role: instructor.role || undefined,
          imgUrl: instructor.imgUrl || org.avatarUrl || undefined,
          description: instructor.description || undefined,
          coursesNo: instructor.coursesNo || undefined
        }
      : { name: '' },
    reviews: {
      items: includeReviews
        ? reviewsVisible.map((r, idx) => ({
            id: `review-${r.id ?? idx}`,
            name: r.name ?? 'Anonymous',
            avatarUrl: r.avatar_url || undefined,
            rating: r.rating ?? 0,
            description: r.description ?? '',
            createdAt: r.created_at ? new Date(r.created_at).toISOString() : undefined
          }))
        : [],
      averageRating
    },
    pricing: {
      cost: calculatedCost,
      currency: course.currency ?? 'USD',
      discount: metadata?.discount,
      showDiscount: metadata?.showDiscount,
      ctaLabel: pricingCtaLabel,
      ctaHref: paidEnrollClick ? undefined : options.enrollHref,
      ctaOnclick: paidEnrollClick,
      reward: metadata?.reward?.show ? { show: true, description: metadata.reward.description ?? '' } : undefined
    },
    footer: landing.footer
  };
}
