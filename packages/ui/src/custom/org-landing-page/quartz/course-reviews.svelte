<script lang="ts">
  import type { CourseReviewItem, CourseLandingPageLabels } from '../types';
  import StarIcon from '@lucide/svelte/icons/star';
  import QuartzCourseSection from './course-section.svelte';

  interface Props {
    reviews: { items: CourseReviewItem[]; averageRating?: number };
    labels?: CourseLandingPageLabels;
  }

  let { reviews, labels }: Props = $props();

  const average = $derived(
    reviews.averageRating ??
      (reviews.items.length > 0
        ? reviews.items.reduce((sum, review) => sum + review.rating, 0) / reviews.items.length
        : null)
  );

  const heading = $derived.by(() => {
    const count = reviews.items.length;
    const countLabel = labels?.reviewsAverageLabel?.(count) ?? `${count} ${count === 1 ? 'review' : 'reviews'}`;

    return average !== null ? `${average.toFixed(1)} out of 5 · ${countLabel}` : countLabel;
  });

  function dateLabel(value?: string): string | undefined {
    if (!value) return undefined;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? undefined
      : parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
</script>

{#if reviews.items.length > 0}
  <QuartzCourseSection id="reviews" sectionKey="reviews" eyebrow={labels?.reviewsEyebrow ?? 'Reviews'} {heading}>
    <div class="ui:grid ui:grid-cols-1 ui:@2xl:grid-cols-2">
      {#each reviews.items as review, index (review.id)}
        <figure
          class="ui:m-0 ui:py-5 ui:border-t ui:border-[var(--landing-border-soft)] {index % 2 === 0
            ? 'ui:@2xl:pr-6 ui:@2xl:border-r ui:@2xl:border-[var(--landing-border-soft)]'
            : 'ui:@2xl:pl-6'}"
        >
          <span class="ui:flex ui:gap-0.5 ui:text-[var(--landing-fg)]" aria-label={`${review.rating} out of 5`}>
            {#each Array(5) as _, star (star)}
              <StarIcon class="ui:size-3.5 {star < review.rating ? 'ui:fill-current' : 'ui:opacity-25'}" />
            {/each}
          </span>
          <blockquote
            class="ui:m-0 ui:mt-2.5 ui:mb-3.5 ui:text-[15px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)]"
          >
            {review.description}
          </blockquote>
          <figcaption class="ui:flex ui:items-center ui:gap-2.5">
            {#if review.avatarUrl}
              <img src={review.avatarUrl} alt="" class="ui:size-6 ui:rounded-full ui:object-cover" />
            {/if}
            <span class="ui:text-[13px] ui:font-medium ui:text-[var(--landing-fg)]">{review.name}</span>
            {#if dateLabel(review.createdAt)}
              <span class="ui:text-[12.5px] ui:text-[var(--landing-fg-faint)]">· {dateLabel(review.createdAt)}</span>
            {/if}
          </figcaption>
        </figure>
      {/each}
    </div>
  </QuartzCourseSection>
{/if}
