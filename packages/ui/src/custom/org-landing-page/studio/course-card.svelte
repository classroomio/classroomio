<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
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
  class="ui:group ui:flex ui:flex-col ui:h-full ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:rounded-xl ui:overflow-hidden ui:transition-colors ui:no-underline {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:border-[var(--landing-fg)]/30'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  <div
    class="ui:relative ui:h-[200px] ui:bg-[var(--landing-card-soft)]/50 ui:border-b ui:border-[var(--landing-border)] ui:p-5 ui:overflow-hidden"
  >
    {#if course.logo}
      <img src={course.logo} alt="" class="ui:absolute ui:inset-0 ui:w-full ui:h-full ui:object-cover ui:opacity-60" />
    {/if}
    <div
      class="ui:relative ui:flex ui:items-start ui:justify-between"
      style="background: linear-gradient(180deg, transparent 60%, var(--landing-card) 100%);"
    >
      {#if courseTypeMeta}
        <span
          class="ui:inline-flex ui:items-center ui:gap-1.5 ui:px-2 ui:py-0.5 ui:bg-[var(--landing-bg)]/95 ui:border ui:border-[var(--landing-border)] ui:rounded-md ui:text-[11px] ui:font-medium ui:text-[var(--landing-fg)]"
        >
          {courseTypeMeta.label}
        </span>
      {/if}
    </div>
  </div>
  <div class="ui:p-5 ui:flex ui:items-end ui:justify-between ui:gap-3 ui:flex-1">
    <div class="ui:flex-1 ui:min-w-0">
      <p class="ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:mb-1.5 ui:m-0">
        {course.price || formatCurrency(course.cost, course.currency)}
      </p>
      <h3 class="ui:text-base ui:font-medium ui:tracking-tight ui:leading-snug ui:m-0">
        {course.title}
      </h3>
    </div>
    <span
      class="ui:flex-shrink-0 ui:inline-flex ui:items-center ui:justify-center ui:size-8 ui:rounded-full ui:border ui:border-[var(--landing-border)] ui:text-[var(--landing-fg-muted)] ui:group-hover:bg-[var(--landing-fg)] ui:group-hover:text-[var(--landing-bg)] ui:group-hover:border-[var(--landing-fg)] ui:transition-colors"
      aria-hidden="true"
      aria-label={labels?.enrollLabel ?? 'Enroll'}
    >
      <ArrowRightIcon class="ui:size-3.5" />
    </span>
  </div>
</a>
