<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import * as Card from '../../../base/card';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TagIcon from '@lucide/svelte/icons/tag';
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
  class="ui:block ui:h-full ui:no-underline {disableCourseLinks
    ? 'ui:cursor-default'
    : 'ui:cursor-pointer ui:transition-colors'}"
  aria-disabled={disableCourseLinks}
  tabindex={disableCourseLinks ? -1 : undefined}
>
  <Card.Root
    class="ui:rounded-none ui:border-[var(--landing-border)]/60 ui:shadow-none ui:h-full ui:p-0 ui:gap-0 {disableCourseLinks
      ? ''
      : 'ui:hover:border-[var(--landing-border)] ui:transition-colors'}"
  >
    <Card.Content class="ui:p-8 ui:flex ui:flex-col ui:flex-1">
      <Card.Title class="ui:text-xl ui:font-normal ui:mb-4">{course.title}</Card.Title>
      <Card.Description class="ui:mb-8 ui:line-clamp-3 ui:text-base ui:leading-relaxed">
        {course.description}
      </Card.Description>

      <div class="ui:flex ui:items-center ui:gap-6 ui:text-sm ui:mt-auto">
        {#if course.duration}
          <div class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg-muted)]">
            <ClockIcon class="ui:size-4" />
            <span>{course.duration}</span>
          </div>
        {/if}
        {#if courseTypeMeta}
          {@const TypeIcon = courseTypeMeta.icon}
          <div class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg-muted)]">
            <TypeIcon class={courseTypeMeta.iconClass} />
            <span>{courseTypeMeta.label}</span>
          </div>
        {/if}
        {#if primaryTag}
          <div class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg-muted)]">
            <TagIcon class="ui:size-4" />
            {#if primaryTag.color}
              <span
                class="ui:inline-block ui:h-2 ui:w-2 ui:rounded-full"
                style={`background-color: ${primaryTag.color}`}
                aria-hidden="true"
              ></span>
            {/if}
            <span>{primaryTag.name}</span>
          </div>
        {/if}
        <div class="ui:ml-auto ui:font-semibold">
          {course.price || formatCurrency(course.cost, course.currency)}
        </div>
      </div>
    </Card.Content>
  </Card.Root>
</a>
