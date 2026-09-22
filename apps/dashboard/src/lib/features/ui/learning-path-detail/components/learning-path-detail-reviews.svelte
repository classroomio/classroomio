<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathReviewItem } from '@cio/ui/custom/org-landing-page';

  interface Props {
    reviews: LearningPathReviewItem[];
  }

  let { reviews }: Props = $props();

  function fullStars(rating: number) {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(rating))) }, (_, index) => index);
  }
</script>

{#if reviews.length > 0}
  <section class="mx-auto w-full max-w-4xl px-4 py-12 md:px-6">
    <h2 class="ui:text-foreground mb-6 text-2xl font-semibold">
      {t.get('public_learning_paths.detail.reviews_heading')}
    </h2>

    <div class="flex flex-col gap-6">
      {#each reviews as review (review.id)}
        <article class="ui:bg-card ui:border-border rounded-lg border p-6">
          <div class="flex flex-wrap items-center gap-4">
            {#if review.avatarUrl}
              <img
                src={review.avatarUrl}
                alt={review.name}
                class="h-12 w-12 rounded-full object-cover"
                loading="lazy"
              />
            {/if}

            <div>
              <p class="ui:text-foreground font-medium">{review.name}</p>

              <p
                class="ui:text-muted-foreground text-sm"
                aria-label={t.get('public_learning_paths.detail.rating_label', { rating: review.rating })}
              >
                {'★'.repeat(fullStars(review.rating).length)}
                <span class="sr-only">({review.rating}/5)</span>
              </p>
            </div>
          </div>

          {#if review.description}
            <p class="ui:text-muted-foreground mt-4 text-sm leading-relaxed">{review.description}</p>
          {/if}
        </article>
      {/each}
    </div>
  </section>
{/if}
