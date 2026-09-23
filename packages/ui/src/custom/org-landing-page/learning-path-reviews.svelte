<script lang="ts">
  import type { LearningPathReviewItem, LearningPathLandingPageLabels, OrgLandingPageTheme } from './types';
  import { courseLandingTokens } from './course-landing-page.tokens';
  import StarIcon from '@lucide/svelte/icons/star';

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
    <div class="ui:max-w-[800px] ui:mx-auto">
      <div class={t.sectionHeader}>
        {#if labels?.reviewsEyebrow}
          <span class={t.eyebrow}>{labels.reviewsEyebrow}</span>
        {/if}
        <h2 class={t.heading}>{labels?.reviewsHeading ?? 'What learners say'}</h2>
        <p class={t.body}>
          {labels?.reviewsLead ?? 'From people who finished the path.'}
        </p>
        <span class={t.headingRule} aria-hidden="true"></span>
      </div>

      <div class="ui:grid ui:grid-cols-1 ui:sm:grid-cols-2 ui:gap-5 ui:mt-8">
        {#each reviews as review (review.id)}
          <article
            class="ui:flex ui:flex-col ui:justify-between ui:bg-[var(--landing-card)] ui:border ui:border-[var(--landing-border)] ui:[border-radius:var(--landing-radius-card)] ui:[box-shadow:var(--landing-shadow-card)] ui:p-6"
          >
            <div>
              <div class="ui:flex ui:items-center ui:gap-1 ui:mb-3">
                {#each Array(fullStars(review.rating)) as _}
                  <StarIcon class="ui:size-4 ui:fill-amber-400 ui:text-amber-400" />
                {/each}
              </div>

              {#if review.description}
                <blockquote
                  class="ui:text-sm ui:sm:text-base ui:text-[var(--landing-fg)] ui:leading-relaxed ui:italic ui:mb-6"
                >
                  "{review.description}"
                </blockquote>
              {/if}
            </div>

            <div class="ui:flex ui:items-center ui:gap-3 ui:pt-4 ui:border-t ui:border-[var(--landing-border)]/60">
              {#if review.avatarUrl}
                <img
                  src={review.avatarUrl}
                  alt={review.name}
                  loading="lazy"
                  class="ui:size-10 ui:rounded-full ui:object-cover ui:border ui:border-[var(--landing-border)]"
                />
              {:else}
                <div
                  class="ui:size-10 ui:rounded-full ui:bg-[var(--landing-accent)]/15 ui:text-[var(--landing-accent)] ui:flex ui:items-center ui:justify-center ui:font-bold ui:text-xs ui:border ui:border-[var(--landing-border)]"
                >
                  {review.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
              {/if}

              <div>
                <p class="ui:font-semibold ui:text-sm ui:text-[var(--landing-fg)]">{review.name}</p>
                {#if review.location}
                  <p class="ui:text-xs ui:text-[var(--landing-fg-muted)]">{review.location}</p>
                {/if}
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>
{/if}
