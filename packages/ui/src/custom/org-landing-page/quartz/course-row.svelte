<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import { getCourseCoverImage, getCourseTypeLandingMeta, getPrimaryCourseTag } from '../landing-page-utils';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { course, disableCourseLinks = false, labels }: Props = $props();

  const courseTypeMeta = $derived(getCourseTypeLandingMeta(course));
  const primaryTag = $derived(getPrimaryCourseTag(course));
  const cover = $derived(getCourseCoverImage(course));

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

  const exercisesLabel = $derived.by(() => {
    if (!course.exerciseCount) return undefined;
    if (labels?.exercisesLabel) return labels.exercisesLabel(course.exerciseCount);

    return course.exerciseCount === 1 ? '1 exercise' : `${course.exerciseCount} exercises`;
  });
</script>

<svelte:element
  this={href ? 'a' : 'div'}
  {href}
  class="ui:grid ui:grid-cols-1 ui:@2xl:grid-cols-[300px_minmax(0,1fr)] ui:no-underline ui:border-t ui:border-[var(--landing-border)] ui:bg-[var(--landing-card)] ui:transition-colors {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:hover:bg-[var(--landing-card-soft)]'}"
  aria-disabled={disableCourseLinks}
>
  <div
    class="ui:grid ui:place-items-center ui:aspect-[4/3] ui:@2xl:aspect-auto ui:overflow-hidden ui:bg-[var(--landing-card-soft)] ui:border-b ui:@2xl:border-b-0 ui:@2xl:border-r ui:border-[var(--landing-border)]"
  >
    <img src={cover} alt="" class="ui:h-full ui:w-full ui:object-cover" />
  </div>

  <div class="ui:flex ui:flex-col ui:p-7 ui:@2xl:px-8">
    {#if primaryTag}
      <span
        class="ui:inline-flex ui:items-center ui:gap-1.5 ui:self-start ui:mb-3.5 ui:px-2.5 ui:py-0.5 ui:rounded-[var(--landing-radius-pill)] ui:border ui:border-[var(--landing-border)] ui:text-xs ui:text-[var(--landing-fg-muted)]"
      >
        {#if primaryTag.color}
          <span class="ui:h-1.5 ui:w-1.5 ui:rounded-full" style={`background-color: ${primaryTag.color}`}></span>
        {/if}
        {primaryTag.name}
      </span>
    {/if}

    <h3
      class="ui:m-0 ui:mb-2.5 ui:text-2xl ui:text-[var(--landing-fg)] ui:[font-weight:var(--landing-heading-weight)] ui:[letter-spacing:var(--landing-heading-tracking)]"
    >
      {course.title}
    </h3>
    <p
      class="ui:m-0 ui:max-w-[62ch] ui:text-[15px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)] ui:line-clamp-3"
    >
      {course.description}
    </p>

    <div class="ui:mt-auto ui:pt-8 ui:flex ui:flex-wrap ui:items-center ui:justify-between ui:gap-4">
      <span class="ui:flex ui:flex-wrap ui:gap-x-4 ui:gap-y-1 ui:text-[13px] ui:text-[var(--landing-fg-faint)]">
        {#if lessonsLabel}<span>{lessonsLabel}</span>{/if}
        {#if exercisesLabel}<span>{exercisesLabel}</span>{/if}
        {#if courseTypeMeta}<span>{courseTypeMeta.label}</span>{/if}
      </span>
      <span class="ui:flex ui:items-center ui:gap-5">
        <span class="ui:text-[15px] ui:font-semibold ui:text-[var(--landing-fg)]">{priceLabel}</span>
        <span
          class="ui:inline-flex ui:items-center ui:gap-1.5 ui:text-[13.5px] ui:font-medium ui:text-[var(--landing-fg)]"
        >
          {labels?.enrollLabel ?? 'View course'}
          <ChevronRightIcon class="ui:size-3.5" aria-hidden="true" />
        </span>
      </span>
    </div>
  </div>
</svelte:element>
