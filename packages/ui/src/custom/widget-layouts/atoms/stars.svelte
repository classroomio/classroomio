<script lang="ts">
  import { getStarSegments } from '../utils';

  let {
    rating = null,
    ratingCount,
    showCount = true
  }: { rating?: number | null; ratingCount?: number | null; showCount?: boolean } = $props();

  const segments = $derived(getStarSegments(rating));
  const showStars = $derived(rating != null);
</script>

<span class="cio-stars">
  {#if showStars}
    {#each Array(segments.filled) as _, i (`f-${i}`)}
      <span class="cio-star">★</span>
    {/each}
    {#each Array(segments.empty) as _, i (`e-${i}`)}
      <span class="cio-star cio-star-empty">★</span>
    {/each}
    <span class="cio-rating-val">{rating?.toFixed(1)}</span>
    {#if showCount && ratingCount}
      <span class="cio-rating-count">({ratingCount})</span>
    {/if}
  {/if}
</span>
