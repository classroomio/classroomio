import type { LearningPathDetail } from './learning-path-detail.types';
import type { LearningPathItem, LearningPathLandingPageLabels, LearningPathLandingPageProps } from './types';

export interface LearningPathSectionNavItem {
  id: string;
  label: string;
}

export function buildLearningPathSectionNavItems(
  props: Partial<
    Pick<
      LearningPathLandingPageProps,
      'about' | 'series' | 'hasCertificate' | 'instructors' | 'reviews' | 'faq' | 'pricing'
    >
  >,
  labels?: LearningPathLandingPageLabels
): LearningPathSectionNavItem[] {
  const items: LearningPathSectionNavItem[] = [];
  const { about, series = [], hasCertificate, instructors = [], reviews = [], faq = [], pricing } = props;

  if (about?.outcomes?.length || about?.skills?.length) {
    items.push({ id: 'about', label: labels?.navAboutLabel ?? 'About' });
  }

  if (series.length > 0) {
    items.push({ id: 'series', label: labels?.navSeriesLabel ?? 'Courses' });
  }

  if (hasCertificate) {
    items.push({ id: 'certificate', label: labels?.navCertificateLabel ?? 'Certificate' });
  }

  if (instructors.length > 0) {
    items.push({ id: 'instructors', label: labels?.navInstructorsLabel ?? 'Instructors' });
  }

  if (reviews.length > 0) {
    items.push({ id: 'reviews', label: labels?.navReviewsLabel ?? 'Reviews' });
  }

  if (faq.length > 0) {
    items.push({ id: 'faq', label: labels?.navFaqLabel ?? 'FAQ' });
  }

  if (pricing) {
    items.push({ id: 'pricing', label: labels?.navPricingLabel ?? 'Pricing' });
  }

  return items;
}

export function toLearningPathDetail(
  paths: LearningPathItem[],
  details: Record<string, LearningPathDetail>,
  slug: string
): LearningPathDetail | null {
  const path = paths.find((candidate) => candidate.slug === slug);

  if (!path) return null;

  return details[slug] ?? null;
}
