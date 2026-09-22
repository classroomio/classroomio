import type { AccountOrg, PublicOrg } from '$features/app/types';
import { normalizeLandingPageSettings } from '$features/org/utils/landing-page';
import { t } from '$lib/utils/functions/translations';
import type {
  LearningPathDetail,
  LearningPathLandingPageLabels,
  LearningPathLandingPageProps
} from '@cio/ui/custom/org-landing-page';

function hoursLabel(hours: number): string {
  return t.get('public_learning_paths.detail.hours_label', { hours });
}

function courseCountLabel(count: number): string {
  return t.get('public_learning_paths.course_count_label', { count });
}

function enrolledLabel(count: number): string {
  return t.get('public_learning_paths.enrolled_label', { count });
}

function ratingLabel(rating: number): string {
  return t.get('public_learning_paths.detail.rating_label', { rating });
}

function lessonDurationLabel(minutes: number): string {
  return `${minutes}m`;
}

function buildLabels(detail: LearningPathDetail): LearningPathLandingPageLabels {
  return {
    seriesHeading: t.get('public_learning_paths.detail.series_heading'),
    certificateHeading: t.get('public_learning_paths.detail.certificate_heading'),
    certificateIssuerHeading: t.get('public_learning_paths.detail.certificate_issuer'),
    certificateValidityHeading: t.get('public_learning_paths.detail.certificate_validity'),
    instructorsHeading: t.get('public_learning_paths.detail.instructors_heading'),
    reviewsHeading: t.get('public_learning_paths.detail.reviews_heading'),
    faqHeading: t.get('public_learning_paths.detail.faq_heading'),
    noFaqLabel: t.get('public_learning_paths.detail.no_faq'),
    lockedLabel: t.get('public_learning_paths.detail.locked_label'),
    unlockedLabel: t.get('public_learning_paths.detail.unlocked_label'),
    ratingLabel,
    courseCountLabel,
    hoursLabel,
    enrolledLabel,
    lessonDurationLabel,
    enrollFreeLabel: t.get('public_learning_paths.detail.enroll_free'),
    enrollLabel: (cost: number, currency: string) =>
      t.get('public_learning_paths.detail.enroll_label', { cost, currency }),
    viewAllLabel: t.get('public_learning_paths.detail.view_all')
  };
}

function buildStats(detail: LearningPathDetail): Array<{ label: string; value: string }> {
  return [
    { label: 'Courses', value: detail.courseCount.toString() },
    { label: 'Hours', value: detail.totalHours.toString() },
    detail.hasCertificate ? { label: 'Certificate', value: 'Included' } : null,
    { label: 'Enrolled', value: detail.totalStudents.toString() }
  ].filter(Boolean) as Array<{ label: string; value: string }>;
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
  const isFree = detail.cost === 0;

  const primaryActionLabel = isFree
    ? t.get('public_learning_paths.detail.enroll_free')
    : t.get('public_learning_paths.detail.enroll_label', { cost: detail.cost, currency: detail.currency });

  const showDiscount = Boolean(detail.metadata?.discount && detail.metadata?.showDiscount);

  return {
    theme: landing.theme,
    orgName: org.name ?? '',
    logoUrl: org.avatarUrl ?? undefined,
    navItems: landing.navItems,
    authAction: options.authAction,
    hero: {
      heading: detail.title,
      subheading: detail.description,
      primaryAction: { label: primaryActionLabel, href: options.enrollHref },
      secondaryAction: showDiscount
        ? { label: t.get('public_learning_paths.detail.view_all'), href: '/learning-paths' }
        : undefined,
      image: detail.logo || undefined,
      stats: buildStats(detail),
      eyebrow: org.name ?? undefined
    },
    series: detail.series,
    certificate: detail.certificate ?? null,
    hasCertificate: detail.hasCertificate,
    instructors: detail.instructors,
    reviews: detail.reviews,
    faq: detail.faq,
    footer: landing.footer,
    labels: buildLabels(detail)
  };
}
