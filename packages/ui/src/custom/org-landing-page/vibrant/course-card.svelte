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

  function formatCost(cost?: number, currency = 'USD'): string {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cost);
  }
</script>

<a
  {href}
  class="ui:group ui:flex ui:flex-col ui:h-full ui:overflow-hidden ui:rounded-[20px] ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-card-soft)] ui:no-underline ui:transition-colors ui:hover:bg-[var(--landing-card)] {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  {#if course.logo}
    <div
      class="ui:h-[180px] ui:bg-cover ui:bg-center"
      style="background-image: url('{course.logo}');"
      aria-hidden="true"
    ></div>
  {:else}
    <div
      class="ui:h-[180px] ui:relative ui:overflow-hidden"
      style="
        background:
          radial-gradient(60% 80% at 30% 30%, color-mix(in oklab, var(--landing-accent) 40%, white) 0%, transparent 65%),
          linear-gradient(135deg, color-mix(in oklab, var(--landing-accent) 70%, white) 0%, color-mix(in oklab, var(--landing-accent) 30%, white) 100%);
      "
      aria-hidden="true"
    ></div>
  {/if}

  <div class="ui:flex ui:flex-col ui:flex-1 ui:p-7">
    {#if courseTypeMeta}
      <span
        class="ui:text-[12px] ui:font-medium ui:tracking-[0.04em] ui:uppercase ui:text-[var(--landing-fg-muted)] ui:mb-3"
      >
        {courseTypeMeta.label}
      </span>
    {/if}
    <h3
      class="ui:text-xl ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-2.5 ui:text-[var(--landing-fg)]"
      style="letter-spacing: -0.015em;"
    >
      {course.title}
    </h3>
    <p
      class="ui:text-[15px] ui:text-[var(--landing-fg-muted)] ui:leading-relaxed ui:line-clamp-3 ui:m-0 ui:mb-5 ui:flex-1"
    >
      {course.description}
    </p>
    <div
      class="ui:flex ui:items-center ui:justify-between ui:pt-5 ui:mt-auto"
      style="border-top: 1px solid var(--landing-border-soft);"
    >
      <span class="ui:text-lg ui:font-semibold ui:text-[var(--landing-fg)]" style="letter-spacing: -0.01em;">
        {course.price || formatCost(course.cost, course.currency)}
      </span>
      <span
        class="ui:inline-flex ui:items-center ui:gap-1 ui:text-sm ui:font-medium ui:text-[var(--landing-accent)] ui:transition-transform ui:group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        {labels?.enrollLabel ?? 'Enroll'} <span>→</span>
      </span>
    </div>
  </div>
</a>
