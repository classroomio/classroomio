<script lang="ts">
  import type { LearningPathReviewItem, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';

  interface Props {
    variant: OrgLandingPageTheme;
    reviews: LearningPathReviewItem[];
    labels?: LearningPathLandingPageLabels;
  }

  let { variant, reviews, labels }: Props = $props();

  const t = $derived(courseLandingTokens(variant));

  function fullStars(rating: number): number {
    return Math.max(0, Math.min(5, Math.round(rating)));
  }
</script>

{#if reviews.length > 0}
  <section id="reviews" class={t.sectionShell}>
    <div class={t.sectionInner}>
      <div class={t.sectionHeader}>
        {#if labels?.reviewsEyebrow}
          <span class={t.eyebrow}>{labels.reviewsEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.reviewsHeading ?? 'What students say'}</h2>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:flex ui:flex-col ui:gap-6">
        {#each reviews as review (review.id)}
          <article
            class="ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6"
          >
            <div class="ui:flex ui:flex-wrap ui:items-center ui:gap-4">
              {#if review.avatarUrl}
                <img
                  src={review.avatarUrl}
                  alt={review.name}
                  loading="lazy"
                  class="ui:size-12 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]"
                />
              {/if}

              <div>
                <p class="ui:font-medium ui:text-[var(--landing-fg)]">{review.name}</p>

                <p
                  class="ui:text-sm ui:text-[var(--landing-fg-muted)]"
                  aria-label={labels?.ratingLabel?.(review.rating) ?? `Rated ${review.rating} out of 5`}
                >
                  {'★'.repeat(fullStars(review.rating))}
                  <span class="ui:sr-only">({review.rating}/5)</span>
                </p>
              </div>
            </div>

            {#if review.description}
              <p class="ui:mt-4 ui:text-sm ui:leading-relaxed ui:text-[var(--landing-fg-muted)]">
                {review.description}
              </p>
            {/if}
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
