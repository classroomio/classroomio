import type { CoursePricing, CourseLandingPageProps, CourseLandingPageLabels } from './types';

export function alignHeroCtaWithPricing(
  hero: CourseLandingPageProps['hero'],
  pricing: CoursePricing
): CourseLandingPageProps['hero'] {
  return {
    ...hero,
    primaryAction: {
      label: pricing.ctaLabel,
      href: pricing.ctaOnclick ? undefined : (pricing.ctaHref ?? '#pricing'),
      onclick: pricing.ctaOnclick,
      disabled: hero.primaryAction.disabled
    }
  };
}

export interface SectionNavItem {
  id: string;
  label: string;
}

export function buildCourseSectionNavItems(
  props: Pick<CourseLandingPageProps, 'info' | 'curriculum' | 'chips' | 'instructor' | 'reviews'>,
  labels?: CourseLandingPageLabels
): SectionNavItem[] {
  const items: SectionNavItem[] = [];
  const { info, curriculum, chips, reviews } = props;

  const hasInfo = Boolean(info.requirements || info.description || info.goals || info.certificateUrl);
  if (hasInfo) {
    items.push({ id: 'course-info', label: labels?.navAboutLabel ?? 'About' });
  }

  if (curriculum.sections.length > 0) {
    items.push({ id: 'curriculum', label: labels?.navCurriculumLabel ?? 'Modules' });
  }

  const hasChips = Boolean((chips?.skills?.length ?? 0) > 0 || (chips?.tools?.length ?? 0) > 0);
  if (hasChips) {
    items.push({ id: 'course-chips', label: labels?.navSkillsLabel ?? 'Skills' });
  }

  items.push({ id: 'instructor', label: labels?.navInstructorLabel ?? 'Instructor' });

  if (reviews.items.length > 0) {
    items.push({ id: 'reviews', label: labels?.navReviewsLabel ?? 'Reviews' });
  }

  items.push({ id: 'pricing', label: labels?.navPricingLabel ?? 'Pricing' });

  return items;
}
