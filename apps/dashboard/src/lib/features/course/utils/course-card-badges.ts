import type { Component } from 'svelte';
import UserIcon from '@lucide/svelte/icons/user';
import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
import GlobeIcon from '@lucide/svelte/icons/globe';

export interface CourseCardBadgeMeta {
  labelKey: string;
  icon: Component;
  iconClass: string;
}

const COURSE_TYPE_BADGES: Record<string, CourseCardBadgeMeta> = {
  LIVE_CLASS: {
    labelKey: 'course.navItem.settings.live_class',
    icon: CircleDotIcon,
    iconClass: 'ui:size-3 ui:shrink-0 ui:text-red-600'
  },
  SELF_PACED: {
    labelKey: 'course.navItem.settings.self_paced',
    icon: UserIcon,
    iconClass: 'ui:size-3 ui:shrink-0 ui:text-primary'
  },
  COMPLIANCE: {
    labelKey: 'course.navItem.settings.compliance',
    icon: ShieldCheckIcon,
    iconClass: 'ui:size-3 ui:shrink-0 ui:text-emerald-600'
  },
  SPECIALIZATION: {
    labelKey: 'specialization.course_tag',
    icon: TrendingUpIcon,
    iconClass: 'ui:size-3 ui:shrink-0 ui:text-amber-600'
  }
};

const PUBLIC_COURSE_BADGE: CourseCardBadgeMeta = {
  labelKey: 'courses.course_card.public_badge',
  icon: GlobeIcon,
  iconClass: 'ui:size-3 ui:shrink-0 ui:text-primary'
};

/**
 * The course card's type badge (live, self-paced, compliance, specialization).
 * Public courses get the visibility badge instead.
 */
export function getCourseTypeBadgeMeta(courseType: string | null | undefined): CourseCardBadgeMeta | undefined {
  if (!courseType) return undefined;

  return COURSE_TYPE_BADGES[courseType];
}

export function getCourseVisibilityBadgeMeta(courseType: string | null | undefined): CourseCardBadgeMeta | undefined {
  return courseType === 'PUBLIC' ? PUBLIC_COURSE_BADGE : undefined;
}

/** Resolves a badge's label with the caller's translate function, the shape `CourseCard` takes. */
export function toCourseCardBadge(meta: CourseCardBadgeMeta | undefined, translate: (key: string) => string) {
  if (!meta) return undefined;

  return { label: translate(meta.labelKey), icon: meta.icon, iconClass: meta.iconClass };
}
