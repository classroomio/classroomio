<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TagIcon from '@lucide/svelte/icons/tag';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { getCourseTypeLandingMeta, getPrimaryCourseTag } from '../landing-page-utils';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { course, disableCourseLinks = false, labels }: Props = $props();

  const courseTypeMeta = $derived(getCourseTypeLandingMeta(course));
  const primaryTag = $derived(getPrimaryCourseTag(course));

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
  class="course-card ui:flex ui:flex-col ui:h-full ui:no-underline ui:bg-[var(--landing-bg)] ui:transition-colors {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:bg-[var(--landing-card-soft)]/40'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  {#if course.logo}
    <div
      class="ui:h-40 ui:w-full ui:bg-cover ui:bg-center ui:relative"
      style={`background-image: url(${course.logo});`}
    >
      {#if courseTypeMeta}
        <span
          class="ui:absolute ui:top-3 ui:left-3 ui:bg-[var(--landing-bg)]/95 ui:text-[var(--landing-fg)] ui:text-[11px] ui:font-semibold ui:px-2.5 ui:py-1 ui:rounded-full"
        >
          {courseTypeMeta.label}
        </span>
      {/if}
    </div>
  {/if}

  <div class="ui:p-5 ui:flex ui:flex-col ui:flex-1 ui:gap-2">
    <h3 class="ui:text-lg ui:font-bold ui:tracking-tight ui:leading-snug ui:m-0">
      {course.title}
    </h3>
    <p class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:line-clamp-2 ui:leading-relaxed ui:m-0 ui:flex-1">
      {course.description}
    </p>

    <div class="ui:flex ui:items-center ui:gap-2 ui:flex-wrap ui:text-xs ui:text-[var(--landing-fg-muted)] ui:mt-2">
      {#if course.duration}
        <span class="ui:inline-flex ui:items-center ui:gap-1">
          <ClockIcon class="ui:size-3.5" />
          {course.duration}
        </span>
      {/if}
      {#if primaryTag}
        <span class="ui:inline-flex ui:items-center ui:gap-1">
          <TagIcon class="ui:size-3.5" />
          {#if primaryTag.color}
            <span
              class="ui:inline-block ui:size-2 ui:rounded-full"
              style={`background-color: ${primaryTag.color}`}
              aria-hidden="true"
            ></span>
          {/if}
          {primaryTag.name}
        </span>
      {/if}
    </div>

    <div
      class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:mt-2 ui:border-t ui:border-[var(--landing-border)]/60"
    >
      <span class="ui:text-sm ui:font-bold">
        {course.price || formatCurrency(course.cost, course.currency)}
      </span>
      <span
        class="ui:inline-flex ui:items-center ui:gap-1 ui:text-xs ui:font-semibold ui:text-[var(--landing-accent)]"
        aria-hidden="true"
      >
        {labels?.enrollLabel ?? 'Enroll'}
        <ArrowRightIcon class="ui:size-3.5" />
      </span>
    </div>
  </div>
</a>
