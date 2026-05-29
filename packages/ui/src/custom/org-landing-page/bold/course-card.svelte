<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import * as Card from '../../../base/card';
  import { Button } from '../../../base/button';
  import { BorderBeam } from '../../animation/border-beam';
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

  function formatCurrency(cost?: number, currency = 'USD') {
    if (!cost) return labels?.freeLabel ?? 'Free';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cost);
  }
</script>

<Card.Root
  class="ui:group ui:relative ui:overflow-hidden ui:bg-[var(--landing-bg)] ui:rounded-3xl ui:p-4 ui:flex-col ui:sm:flex-row ui:gap-6 ui:duration-300 ui:h-full ui:border-[var(--landing-border)]/50 {disableCourseLinks
    ? ''
    : 'ui:hover:shadow-xl ui:hover:shadow-primary/5 ui:transition-all'}"
>
  <BorderBeam
    size={120}
    duration={8}
    colorFrom="var(--landing-accent)"
    colorTo="color-mix(in oklab, var(--landing-accent) 65%, white)"
  />
  {#if course.logo}
    <img
      src={course.logo}
      alt={course.title}
      class="ui:w-full ui:sm:w-48 ui:h-48 ui:object-cover ui:rounded-2xl ui:group-hover:scale-[1.02] ui:transition-transform ui:duration-500"
    />
  {/if}
  <Card.Content class="ui:p-2 ui:flex ui:flex-col ui:justify-center ui:flex-1">
    <Card.Title class="ui:text-2xl ui:font-bold ui:mb-2">{course.title}</Card.Title>
    <Card.Description class="ui:mb-6 ui:line-clamp-2">{course.description}</Card.Description>

    <div class="ui:flex ui:items-center ui:gap-4 ui:text-sm ui:font-semibold ui:mb-6">
      {#if course.duration}
        <div
          class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg-muted)] ui:bg-[var(--landing-card-soft)] ui:px-2.5 ui:py-1 ui:rounded-md"
        >
          <ClockIcon class="ui:size-3.5" />
          <span>{course.duration}</span>
        </div>
      {/if}
      {#if courseTypeMeta}
        {@const TypeIcon = courseTypeMeta.icon}
        <div
          class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg)] ui:bg-[var(--landing-card-soft)] ui:px-2.5 ui:py-1 ui:rounded-md"
        >
          <TypeIcon class={courseTypeMeta.iconClass} />
          <span>{courseTypeMeta.label}</span>
        </div>
      {/if}
      {#if primaryTag}
        <div
          class="ui:flex ui:items-center ui:gap-1.5 ui:text-[var(--landing-fg)] ui:bg-[var(--landing-card-soft)] ui:px-2.5 ui:py-1 ui:rounded-md"
        >
          <TagIcon class="ui:size-3.5 ui:text-[var(--landing-accent)]" />
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
    </div>

    <div class="ui:mt-auto ui:flex ui:items-center ui:justify-between">
      <span class="ui:font-black ui:text-lg">{course.price || formatCurrency(course.cost, course.currency)}</span>
      <Button
        href={disableCourseLinks ? undefined : course.link}
        variant="outline"
        class="ui:rounded-lg ui:font-bold ui:text-sm {disableCourseLinks
          ? 'ui:pointer-events-none'
          : 'ui:hover:bg-[var(--landing-accent)] ui:hover:text-[var(--landing-accent-fg)] ui:group-hover:bg-[var(--landing-accent)] ui:group-hover:text-[var(--landing-accent-fg)] ui:transition-colors'}"
        aria-disabled={disableCourseLinks}
        tabindex={disableCourseLinks ? -1 : undefined}
      >
        {labels?.enrollLabel ?? 'Details'}
      </Button>
    </div>
  </Card.Content>
</Card.Root>
