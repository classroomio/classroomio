export { default as nav } from './nav.svelte';
export { default as hero } from './hero.svelte';
export { default as courseCard } from './course-card.svelte';
export { default as org } from './org.svelte';
export { default as course } from './course.svelte';

/** Bordered-cell catalog: the grid owns the top/left rule, each card owns its right/bottom rule. */
export const coursesGridClass =
  'ui:grid ui:grid-cols-1 ui:@xl:grid-cols-2 ui:@4xl:grid-cols-3 ui:border-t ui:border-l ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)]';
