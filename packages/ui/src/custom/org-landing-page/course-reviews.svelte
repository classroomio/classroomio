<script lang="ts">
  import type { CourseLandingPageLabels, CourseReviewItem, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import EditableLandingSection from './editable-section.svelte';
  import StarIcon from '@lucide/svelte/icons/star';

  interface Props {
    variant: OrgLandingPageTheme;
    reviews: { items: CourseReviewItem[]; averageRating?: number };
    labels?: CourseLandingPageLabels;
  }

  let { variant, reviews, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  const computedAverage = $derived(
    reviews.averageRating ??
      (reviews.items.length > 0 ? reviews.items.reduce((sum, r) => sum + r.rating, 0) / reviews.items.length : null)
  );

  const ratingLabel = $derived(
    computedAverage !== null && reviews.items.length > 0
      ? (labels?.reviewsAverageLabel?.(reviews.items.length) ??
          `Based on ${reviews.items.length} ${reviews.items.length === 1 ? 'review' : 'reviews'}`)
      : null
  );

  function dateLabel(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }
</script>

{#if reviews.items.length > 0}
  <EditableLandingSection sectionKey="reviews">
    <section id="reviews" class={t.sectionShell}>
      <div class={t.sectionInner}>
        <div class={t.sectionHeader}>
          <span class={t.eyebrow}>{labels?.reviewsEyebrow ?? 'Reviews'}</span>
          <h2 class={t.heading}>{labels?.reviewsHeading ?? 'What students say'}</h2>
          <span class={t.headingRule} aria-hidden="true"></span>
        </div>

        {#if computedAverage !== null}
          <div class={t.reviewsAverage}>
            <span class={t.reviewsAverageValue}>{computedAverage.toFixed(1)}</span>
            <div class={t.reviewStars}>
              {#each Array(5) as _, i}
                <StarIcon
                  class={`${t.reviewStar} ${i < Math.round(computedAverage) ? 'ui:fill-current' : 'ui:opacity-30'}`}
                />
              {/each}
            </div>
            {#if ratingLabel}
              <span class={t.reviewsAverageLabel}>· {ratingLabel}</span>
            {/if}
          </div>
        {/if}

        <div class={t.reviewsGrid}>
          {#each reviews.items as review (review.id)}
            <article class={t.reviewCard}>
              <div class={t.reviewStars}>
                {#each Array(5) as _, i}
                  <StarIcon class={`${t.reviewStar} ${i < review.rating ? 'ui:fill-current' : 'ui:opacity-30'}`} />
                {/each}
              </div>
              <p class={t.reviewQuote}>{review.description}</p>
              <div class="ui:flex ui:items-center ui:justify-between">
                <span class={t.reviewName}>{review.name}</span>
                {#if review.createdAt}
                  <span class={t.reviewDate}>{dateLabel(review.createdAt)}</span>
                {/if}
              </div>
            </article>
          {/each}
        </div>
      </div>
    </section>
  </EditableLandingSection>
{/if}
