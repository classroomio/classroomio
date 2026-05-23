<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import { defaultEnrolledLabel, defaultLessonsLabel, getCourseTypeLandingMeta } from '../landing-page-utils';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
    /** Index in the parent grid; used to cycle the painterly thumb gradient when the course has no logo. */
    index?: number;
  }

  let { course, disableCourseLinks = false, labels, index = 0 }: Props = $props();

  const thumbGradients = [
    'radial-gradient(60% 80% at 30% 30%, #c4b78b 0%, transparent 60%), linear-gradient(135deg, #8a9460 0%, #c4a878 100%)',
    'radial-gradient(50% 70% at 70% 40%, #d4a48a 0%, transparent 60%), linear-gradient(135deg, #6f5a4a 0%, #b08868 100%)',
    'radial-gradient(60% 80% at 30% 30%, #8aa4b8 0%, transparent 60%), linear-gradient(135deg, #3a4858 0%, #6a7e92 100%)',
    'radial-gradient(60% 80% at 40% 60%, #b8a4a4 0%, transparent 60%), linear-gradient(135deg, #5e4848 0%, #a87a78 100%)',
    'radial-gradient(60% 80% at 50% 50%, #c4c08a 0%, transparent 60%), linear-gradient(135deg, #6a6840 0%, #a8a468 100%)',
    'radial-gradient(60% 80% at 30% 30%, #aab8c4 0%, transparent 60%), linear-gradient(135deg, #4a5868 0%, #788a9a 100%)'
  ];

  const courseTypeMeta = $derived(getCourseTypeLandingMeta(course));
  const resolvedLessonsLabel = $derived(labels?.lessonsLabel ?? defaultLessonsLabel);
  const resolvedEnrolledLabel = $derived(labels?.enrolledLabel ?? defaultEnrolledLabel);

  const thumbBg = $derived(
    course.logo ? `center / cover no-repeat url('${course.logo}')` : thumbGradients[index % thumbGradients.length]
  );

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
  class="ui:flex ui:flex-col ui:h-full ui:overflow-hidden ui:rounded-lg ui:no-underline ui:transition-transform ui:hover:-translate-y-0.5 ui:bg-[var(--landing-card-soft)] ui:text-[var(--landing-fg)] {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  <div class="ui:relative ui:h-[168px] ui:overflow-hidden" style="background: {thumbBg};">
    <div
      class="ui:pointer-events-none ui:absolute ui:inset-0"
      style="background-image: repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 5px); mix-blend-mode: overlay;"
      aria-hidden="true"
    ></div>
    {#if courseTypeMeta}
      <span
        class="ui:absolute ui:top-3.5 ui:left-3.5 ui:inline-flex ui:items-center ui:gap-1.5 ui:rounded-full ui:px-2.5 ui:py-0.5 ui:text-[11px] ui:font-medium ui:text-[var(--landing-fg)]"
        style="background: color-mix(in srgb, var(--landing-card) 95%, transparent);"
      >
        {courseTypeMeta.label}
      </span>
    {/if}
    {#if course.duration}
      <span
        class="ui:absolute ui:bottom-3.5 ui:right-3.5 ui:rounded-full ui:px-2.5 ui:py-0.5 ui:text-[11px] ui:tabular-nums"
        style="background: color-mix(in srgb, var(--landing-fg) 70%, transparent); color: var(--landing-bg);"
      >
        {course.duration}
      </span>
    {/if}
  </div>
  <div class="ui:flex ui:flex-col ui:flex-1 ui:p-5 ui:md:p-6">
    <h3
      class="ui:text-[19px] ui:font-medium ui:tracking-tight ui:leading-[1.25] ui:m-0 ui:mb-2 ui:text-[var(--landing-fg)]"
      style="letter-spacing: -0.015em;"
    >
      {course.title}
    </h3>
    <p class="ui:text-sm ui:leading-relaxed ui:line-clamp-3 ui:m-0 ui:mb-4 ui:flex-1 ui:text-[var(--landing-fg-muted)]">
      {course.description}
    </p>

    {#if course.lessonCount || course.totalStudents || course.level}
      <div
        class="ui:flex ui:flex-wrap ui:items-center ui:gap-x-3 ui:gap-y-1 ui:text-[12.5px] ui:mb-4 ui:text-[var(--landing-fg-muted)]"
      >
        {#if course.lessonCount}
          <span>{resolvedLessonsLabel(course.lessonCount)}</span>
        {/if}
        {#if course.level}
          {#if course.lessonCount}
            <span aria-hidden="true">·</span>
          {/if}
          <span>{course.level}</span>
        {/if}
        {#if course.totalStudents}
          {#if course.lessonCount || course.level}
            <span aria-hidden="true">·</span>
          {/if}
          <span>{resolvedEnrolledLabel(course.totalStudents)}</span>
        {/if}
      </div>
    {/if}

    <div
      class="ui:flex ui:items-center ui:justify-between ui:pt-4 ui:mt-auto"
      style="border-top: 1px solid var(--landing-border);"
    >
      <span class="ui:text-base ui:font-semibold ui:text-[var(--landing-fg)]" style="letter-spacing: -0.01em;">
        {course.price || formatCost(course.cost, course.currency)}
      </span>
      <span
        class="ui:inline-flex ui:items-center ui:gap-1 ui:text-sm ui:font-medium ui:text-[var(--landing-accent)]"
        aria-hidden="true"
      >
        {labels?.enrollLabel ?? 'Enroll'} <span>→</span>
      </span>
    </div>
  </div>
</a>
