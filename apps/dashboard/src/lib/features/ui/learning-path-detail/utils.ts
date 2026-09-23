import type { AccountOrg, PublicOrg } from '$features/app/types';
import { normalizeLandingPageSettings } from '$features/org/utils/landing-page';
import { t } from '$lib/utils/functions/translations';
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
    viewAllLabel: t.get('public_learning_paths.detail.view_all')
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
  const isFree = detail.cost === 0;

  const primaryActionLabel = isFree
    ? t.get('public_learning_paths.detail.enroll_free')
    : t.get('public_learning_paths.detail.enroll_label', { cost: detail.cost, currency: detail.currency });

  const showDiscount = Boolean(detail.metadata?.discount && detail.metadata?.showDiscount);

  const originalCost =
    detail.pricing?.originalCost ??
    (detail.metadata?.discount ? Math.round(detail.cost / (1 - detail.metadata.discount / 100)) : undefined);

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
      cost: detail.cost,
      currency: detail.currency,
      originalCost,
      courseCount: detail.courseCount,
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
    pricing: {
      cost: detail.cost,
      currency: detail.currency,
      originalCost,
      discount: detail.metadata?.discount,
      showDiscount,
      features: detail.pricing?.features,
      ctaLabel: primaryActionLabel,
      ctaHref: options.enrollHref
    },
    footer: landing.footer,
    labels: buildLabels(detail)
  };
}
