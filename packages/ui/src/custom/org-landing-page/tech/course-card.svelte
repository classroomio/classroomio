<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { getCourseTypeLandingMeta } from '../landing-page-utils';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { course, disableCourseLinks = false, labels }: Props = $props();

  const courseTypeMeta = $derived(getCourseTypeLandingMeta(course));

  const href = $derived.by(() => {
    if (disableCourseLinks) return undefined;
    return course.link || (course.slug ? `/course/${course.slug}` : undefined);
  });

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<a
  {href}
  class="ui:flex ui:flex-col ui:h-full ui:p-7 ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)] ui:transition-colors ui:no-underline {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:bg-[var(--landing-card-soft)]/40'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  {#if courseTypeMeta}
    <span
      class="ui:inline-block ui:self-start ui:px-2.5 ui:py-1 ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:font-mono ui:text-[10px] ui:font-semibold ui:tracking-wider ui:uppercase ui:mb-4"
    >
      {courseTypeMeta.label}
    </span>
  {/if}
  <h3 class="ui:text-xl ui:font-bold ui:tracking-tight ui:leading-tight ui:mb-3 ui:m-0">
    {course.title}
  </h3>
  <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:flex-1 ui:m-0 ui:mb-5">
    {course.description}
  </p>
  <div
    class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:border-t ui:border-dashed ui:border-[var(--landing-border)]"
  >
    <span class="ui:font-mono ui:text-sm ui:font-bold">
      {course.price || formatCurrency(course.cost, course.currency)}
    </span>
    <span
      class="ui:inline-flex ui:items-center ui:gap-1 ui:font-mono ui:text-xs ui:text-[var(--landing-accent)] ui:font-bold"
      aria-hidden="true"
    >
      {labels?.enrollLabel ?? 'enroll'}
      <ArrowRightIcon class="ui:size-3.5" />
    </span>
  </div>
  {#if course.duration}
    <p
      class="ui:font-mono ui:text-[11px] ui:text-[var(--landing-fg-muted)] ui:mt-3 ui:inline-flex ui:items-center ui:gap-1.5"
    >
      <ClockIcon class="ui:size-3" />
      {course.duration}
    </p>
  {/if}
</a>
