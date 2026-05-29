<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
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
  class="ui:flex ui:flex-col ui:h-full ui:p-6 ui:gap-2 ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)] ui:transition-colors ui:no-underline {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:bg-[var(--landing-card-soft)]/30'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  {#if courseTypeMeta}
    <span
      class="ui:text-[11px] ui:font-semibold ui:tracking-widest ui:uppercase ui:text-[var(--landing-fg-muted)] ui:mb-1"
    >
      {courseTypeMeta.label}
    </span>
  {/if}
  <h3 class="ui:text-lg ui:font-semibold ui:tracking-tight ui:leading-snug ui:m-0">
    {course.title}
  </h3>
  <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:flex-1 ui:m-0">
    {course.description}
  </p>
  <div class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:mt-3 ui:border-t ui:border-[var(--landing-border)]">
    <span class="ui:text-sm ui:font-semibold">
      {course.price || formatCurrency(course.cost, course.currency)}
    </span>
    <span class="ui:text-sm ui:text-[var(--landing-fg)] ui:underline ui:underline-offset-4" aria-hidden="true">
      {labels?.enrollLabel ?? 'Enroll →'}
    </span>
  </div>
</a>
