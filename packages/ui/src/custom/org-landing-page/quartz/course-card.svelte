<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
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

  const priceLabel = $derived.by(() => {
    if (course.price) return course.price;
    if (!course.cost) return labels?.freeLabel ?? 'Free';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: course.currency || 'USD',
      maximumFractionDigits: 0
    }).format(course.cost);
  });

  const lessonsLabel = $derived.by(() => {
    if (!course.lessonCount) return undefined;
    if (labels?.lessonsLabel) return labels.lessonsLabel(course.lessonCount);

    return course.lessonCount === 1 ? '1 lesson' : `${course.lessonCount} lessons`;
  });
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  {href}
  class="ui:flex ui:flex-col ui:min-h-[260px] ui:p-6 ui:no-underline ui:border-r ui:border-b ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)] ui:transition-colors {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:bg-[var(--landing-card-soft)]'}"
  aria-disabled={disableCourseLinks}
>
  {#if primaryTag}
    <span
      class="ui:inline-flex ui:items-center ui:gap-1.5 ui:self-start ui:mb-3 ui:px-2.5 ui:py-0.5 ui:rounded-[var(--landing-radius-pill)] ui:border ui:border-[var(--landing-border)] ui:text-xs ui:text-[var(--landing-fg-muted)]"
    >
      {#if primaryTag.color}
        <span class="ui:h-1.5 ui:w-1.5 ui:rounded-full" style={`background-color: ${primaryTag.color}`}></span>
      {/if}
      {primaryTag.name}
    </span>
  {/if}

  <h3
    class="ui:m-0 ui:mb-2.5 ui:text-lg ui:leading-snug ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
  >
    {course.title}
  </h3>
  <p class="ui:m-0 ui:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)] ui:line-clamp-3">
    {course.description}
  </p>

  <div class="ui:mt-auto ui:pt-6 ui:flex ui:items-center ui:justify-between ui:gap-4">
    <span class="ui:flex ui:flex-wrap ui:gap-x-3 ui:gap-y-1 ui:text-[13px] ui:text-[var(--landing-fg-faint)]">
      {#if lessonsLabel}<span>{lessonsLabel}</span>{/if}
      {#if courseTypeMeta}<span>{courseTypeMeta.label}</span>{/if}
      {#if course.duration}<span>{course.duration}</span>{/if}
    </span>
    <span class="ui:text-[13.5px] ui:font-semibold ui:text-[var(--landing-fg)] ui:whitespace-nowrap">{priceLabel}</span>
  </div>
</svelte:element>
