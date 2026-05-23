<script lang="ts">
  import type { CourseItem, OrgLandingPageLabels } from '../types';
  import * as Item from '../../../base/item';
  import { CourseCard } from '../../course-card';
  import { calcCourseDiscount, formatExerciseCountLabel, getCourseTypeLandingMeta } from '../landing-page-utils';
  import { cn } from '../../../tools';

  interface Props {
    course: CourseItem;
    disableCourseLinks?: boolean;
    labels?: OrgLandingPageLabels;
  }

  let { course, disableCourseLinks = false, labels }: Props = $props();

  const courseTypeMeta = $derived(getCourseTypeLandingMeta(course));
  const pricingData = $derived({
    cost: course.cost ?? 0,
    discount: course.metadata?.discount ?? 0,
    showDiscount: !!course.metadata?.showDiscount
  });
  const displayCost = $derived(calcCourseDiscount(pricingData.discount, pricingData.cost, pricingData.showDiscount));
  const currencyFormatter = $derived(
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: course.currency ?? 'USD'
    })
  );

  const href = $derived.by(() => {
    if (disableCourseLinks) return undefined;
    return course.link || (course.slug ? `/course/${course.slug}` : undefined);
  });
</script>

<CourseCard
  {href}
  bannerImage={course.logo || ''}
  bannerAlt={course.title}
  title={course.title}
  description={course.description}
  typeBadge={courseTypeMeta
    ? {
        label: courseTypeMeta.label,
        icon: courseTypeMeta.icon,
        iconClass: courseTypeMeta.iconClass
      }
    : undefined}
  class={cn('ui:group ui:relative', !disableCourseLinks && 'ui:cursor-pointer ui:hover:shadow-md ui:transition-shadow')}
>
  {#snippet tags()}
    {#if course.tags && course.tags.length > 0}
      <div class="ui:flex ui:flex-wrap ui:gap-1 ui:min-w-0">
        {#each course.tags as tag (tag.id)}
          <Item.SubDescription
            class="ui:border-[var(--landing-border)] ui:inline-flex ui:shrink-0 ui:items-center ui:gap-1.5 ui:rounded-full ui:border ui:px-2"
          >
            <span
              class="ui:bg-[var(--landing-accent)]/60 ui:inline-block ui:h-1.5 ui:w-1.5 ui:shrink-0 ui:rounded-full"
              style={tag.color ? `background-color: ${tag.color}` : undefined}
              aria-hidden="true"
            ></span>
            <span>{tag.name}</span>
          </Item.SubDescription>
        {/each}
      </div>
    {/if}
  {/snippet}

  {#snippet footer()}
    <div class="ui:flex ui:justify-between ui:w-full">
      <div class="ui:w-[80%]">
        <p class="ui:text-xs ui:pl-2 ui:dark:text-white">
          <span>{course.lessonCount || 0} lessons</span>
          &
          <span>{formatExerciseCountLabel(course.exerciseCount ?? 0)}</span>
        </p>
        <div class="ui:py-2 ui:text-xs">
          {#if course.price != null && String(course.price).length > 0}
            <span class="ui:px-2">{course.price}</span>
          {:else if !displayCost}
            <span class="ui:px-2">{labels?.freeLabel ?? 'Free'}</span>
          {:else if pricingData.showDiscount}
            <span class="ui:px-2">
              {currencyFormatter.format(displayCost)}
              <span class="line-through">
                {currencyFormatter.format(pricingData.cost)}
              </span>
            </span>
          {:else}
            <span class="ui:px-2">{currencyFormatter.format(displayCost)}</span>
          {/if}
        </div>
      </div>
    </div>
  {/snippet}
</CourseCard>
