import type { Component } from 'svelte';
import CircleDotIcon from '@lucide/svelte/icons/circle-dot';
import GlobeIcon from '@lucide/svelte/icons/globe';
import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
import UserIcon from '@lucide/svelte/icons/user';

import type { CourseItem } from './types';

export function getPrimaryCourseTag(course: CourseItem) {
  return course.tags?.[0];
}

/** Label + icon for course `type` (COURSE_TYPE enum) on org landing cards. */
export function getCourseTypeLandingMeta(
  course: CourseItem
): { label: string; icon: Component; iconClass?: string } | undefined {
  const raw = course.type?.trim();
  if (!raw) return undefined;

  const known: Record<string, { label: string; icon: Component; iconClass?: string }> = {
    LIVE_CLASS: {
      label: 'Live class',
      icon: CircleDotIcon,
      iconClass: 'custom ui:size-3.5 ui:shrink-0 ui:text-red-700'
    },
    SELF_PACED: {
      label: 'Self-paced',
      icon: UserIcon,
      iconClass: 'custom ui:size-3.5 ui:shrink-0 ui:text-primary'
    },
    COMPLIANCE: {
      label: 'Compliance',
      icon: ShieldCheckIcon,
      iconClass: 'custom ui:size-3.5 ui:shrink-0 ui:text-emerald-700'
    },
    PUBLIC: {
      label: 'Public',
      icon: GlobeIcon,
      iconClass: 'custom ui:size-3.5 ui:shrink-0 ui:text-primary'
    }
  };

  if (known[raw]) {
    return known[raw];
  }

  const label = raw
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    label: label || raw,
    icon: GraduationCapIcon,
    iconClass: 'custom ui:size-3.5 ui:shrink-0 ui:text-muted-foreground'
  };
}

/** Plain copy for org landing templates (no dashboard i18n). */
export function formatExerciseCountLabel(count: number) {
  if (count === 1) return '1 exercise';
  return `${count} exercises`;
}

/** Mirrors dashboard `calcCourseDiscount` for landing-page course cards. */
export function calcCourseDiscount(percent = 0, cost: number, showDiscount: boolean) {
  if (!percent || !showDiscount) return cost;
  const discountAmount = (percent / 100) * cost;
  const discountedPrice = cost - discountAmount;
  return Math.round(discountedPrice);
}
