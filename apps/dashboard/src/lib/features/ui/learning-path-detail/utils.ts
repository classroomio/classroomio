import type { AccountOrg, PublicOrg } from '$features/app/types';
import { normalizeLandingPageSettings } from '$features/org/utils/landing-page';
import { t } from '$lib/utils/functions/translations';
import { isPathPaid } from '@cio/utils/validation/learning-path';
import type {
  LearningPathDetail,
  LearningPathLandingPageLabels,
  LearningPathLandingPageProps
} from '@cio/ui/custom/org-landing-page';

function courseCountLabel(count: number): string {
  return t.get('public_learning_paths.course_count_label', { count });
}

function enrolledLabel(count: number): string {
  return t.get('public_learning_paths.enrolled_label', { count });
}

function ratingLabel(rating: number): string {
  return t.get('public_learning_paths.detail.rating_label', { rating });
}

function buildLabels(detail: LearningPathDetail): LearningPathLandingPageLabels {
  return {
    aboutHeading: t.get('public_learning_paths.detail.about_heading') || "What you'll learn",
    aboutLead: t.get('public_learning_paths.detail.about_lead'),
    skillsHeading: t.get('public_learning_paths.detail.skills_heading') || "Skills you'll gain",
    seriesEyebrow: t.get('public_learning_paths.detail.series_eyebrow'),
    seriesHeading: t.get('public_learning_paths.detail.series_heading'),
    seriesLead: t.get('public_learning_paths.detail.series_lead'),
    certificateHeading: t.get('public_learning_paths.detail.certificate_heading'),
    certificateIssuerHeading: t.get('public_learning_paths.detail.certificate_issuer'),
    certificateValidityHeading: t.get('public_learning_paths.detail.certificate_validity'),
    instructorsHeading: t.get('public_learning_paths.detail.instructors_heading'),
    instructorsLead: t.get('public_learning_paths.detail.instructors_lead'),
    reviewsHeading: t.get('public_learning_paths.detail.reviews_heading'),
    reviewsLead: t.get('public_learning_paths.detail.reviews_lead'),
    faqHeading: t.get('public_learning_paths.detail.faq_heading'),
    noFaqLabel: t.get('public_learning_paths.detail.no_faq'),
    pricingEyebrow: t.get('public_learning_paths.detail.pricing_eyebrow'),
    enrollPathLabel: t.get('public_learning_paths.detail.enroll_path'),
    lockedLabel: t.get('public_learning_paths.detail.locked_label'),
    unlockedLabel: t.get('public_learning_paths.detail.unlocked_label'),
    ratingLabel,
    courseCountLabel,
    enrolledLabel,
    enrollFreeLabel: t.get('public_learning_paths.detail.enroll_free'),
    enrollLabel: (cost: number, currency: string) =>
      t.get('public_learning_paths.detail.enroll_label', { cost, currency }),
    viewAllLabel: t.get('public_learning_paths.detail.view_all'),
    taughtByTwoLabel: (first: string, second: string) =>
      t.get('public_learning_paths.detail.taught_by_two', { first, second }),
    taughtByManyLabel: (names: string, count: number) =>
      t.get('public_learning_paths.detail.taught_by_many', { names, count }),
    featuresCoursesLine: (courseCount: number) =>
      t.get('public_learning_paths.detail.features_courses_line', { courseCount }),
    featuresContentLine: (lessons: number, exercises: number) =>
      t.get('public_learning_paths.detail.features_content_line', { lessons, exercises }),
    featuresCertificateLine: t.get('public_learning_paths.detail.features_certificate_line'),
    featuresMilestoneLine: t.get('public_learning_paths.detail.features_milestone_line'),
    featuresAccessLine: t.get('public_learning_paths.detail.features_access_line'),
    saveVsIndividualLabel: (amount: string) => t.get('public_learning_paths.detail.save_vs_individual', { amount }),
    statCoursesLabel: t.get('public_learning_paths.detail.stat_courses'),
    statEnrolledLabel: t.get('public_learning_paths.detail.stat_enrolled'),
    statCertificateLabel: t.get('public_learning_paths.detail.stat_certificate'),
    statBeginnerLabel: t.get('public_learning_paths.detail.stat_beginner'),
    statOnCompletionLabel: t.get('public_learning_paths.detail.stat_on_completion'),
    statNoExperienceLabel: t.get('public_learning_paths.detail.stat_no_experience'),
    statReviewsLabel: (count: number) => t.get('public_learning_paths.detail.stat_reviews', { count }),
    fullPathLabel: t.get('public_learning_paths.detail.full_path'),
    savePercentLabel: (percent: number) => t.get('public_learning_paths.detail.save_percent', { percent }),
    socialProofLabel: (students: number, rating: number, reviews: number) =>
      t.get('public_learning_paths.detail.social_proof', { students, rating, reviews }),
    enrollWithCostLabel: (cost: string) => t.get('public_learning_paths.detail.enroll_with_cost', { cost }),
    seriesHeadingCount: (count: number) => t.get('public_learning_paths.detail.series_heading_count', { count }),
    seriesCourseLabel: (index: number) => t.get('public_learning_paths.detail.series_course', { index }),
    seriesLessonsCount: (count: number) => t.get('public_learning_paths.detail.series_lessons', { count }),
    seriesOutcomesHeading: t.get('public_learning_paths.detail.series_outcomes_heading'),
    showOutlineLabel: t.get('public_learning_paths.detail.show_outline'),
    hideOutlineLabel: t.get('public_learning_paths.detail.hide_outline'),
    previewLabel: t.get('public_learning_paths.detail.preview_badge')
  };
}

function pathHeroTotals(detail: LearningPathDetail): { lessons: number; exercises: number } {
  return {
    lessons: detail.series.reduce((sum, course) => sum + (course.lessonCount ?? 0), 0),
    exercises: detail.series.reduce((sum, course) => sum + (course.exerciseCount ?? 0), 0)
  };
}

export function buildLearningPathLandingPageProps(
  detail: LearningPathDetail,
  org: AccountOrg | PublicOrg,
  options: {
    enrollHref: string;
    authAction?: { label: string; href: string };
  }
): LearningPathLandingPageProps {
  const landing = normalizeLandingPageSettings(org.landingpage);
  // Display cost honors the explicit payment switch: a path with payment
  // disabled reads as free even when a stale amount is still stored.
  const displayCost = isPathPaid(detail.cost, { paymentEnabled: detail.paymentEnabled }) ? detail.cost : 0;
  const isFree = displayCost === 0;

  const primaryActionLabel = isFree
    ? t.get('public_learning_paths.detail.enroll_free')
    : t.get('public_learning_paths.detail.enroll_label', { cost: displayCost, currency: detail.currency });

  const showDiscount = Boolean(detail.metadata?.discount && detail.metadata?.showDiscount);

  const computedOriginalCost =
    detail.pricing?.originalCost ??
    (detail.metadata?.discount ? Math.round(detail.cost / (1 - detail.metadata.discount / 100)) : undefined);
  const originalCost = displayCost > 0 && showDiscount ? computedOriginalCost : undefined;
  const heroTotals = pathHeroTotals(detail);

  return {
    theme: landing.theme,
    orgName: org.name ?? '',
    logoUrl: org.avatarUrl ?? undefined,
    navItems: landing.navItems,
    authAction: options.authAction,
    hero: {
      chip: detail.chip,
      heading: detail.title,
      subheading: detail.description,
      primaryAction: { label: primaryActionLabel, href: options.enrollHref },
      cost: displayCost,
      currency: detail.currency,
      originalCost,
      courseCount: detail.courseCount,
      totalLessons: heroTotals.lessons,
      totalExercises: heroTotals.exercises,
      totalStudents: detail.totalStudents,
      rating: detail.rating,
      reviewsCount: detail.reviewsCount,
      hasCertificate: detail.hasCertificate,
      features: detail.pricing?.features,
      instructors: detail.instructors
    },
    about: {
      outcomes: detail.outcomes,
      skills: detail.skills
    },
    series: detail.series,
    certificate: detail.certificate ?? null,
    hasCertificate: detail.hasCertificate,
    instructors: detail.instructors,
    reviews: detail.reviews,
    faq: detail.faq,
    pricing: detail.pricing
      ? {
          cost: displayCost,
          currency: detail.currency,
          originalCost,
          discount: detail.metadata?.discount,
          showDiscount,
          features: detail.pricing?.features,
          ctaLabel: primaryActionLabel,
          ctaHref: options.enrollHref
        }
      : undefined,
    footer: landing.footer,
    labels: buildLabels(detail)
  };
}
