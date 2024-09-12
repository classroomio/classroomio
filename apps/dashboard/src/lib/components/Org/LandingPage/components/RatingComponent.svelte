<script>
  import Star from 'carbon-icons-svelte/lib/Star.svelte';
  import StarFilled from 'carbon-icons-svelte/lib/StarFilled.svelte';
  import StarHalf from 'carbon-icons-svelte/lib/StarHalf.svelte';

  export let rating = 0;
  const maxRating = 5;

  const getStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = maxRating - Math.ceil(rating);
    return { fullStars, hasHalfStar, emptyStars };
  };

  let { fullStars, hasHalfStar, emptyStars } = getStars(rating);
</script>

<div class="flex items-center">
  {#each Array(fullStars) as _}
    <StarFilled class="mr-1 w-4 h-4 fill-[#FFC107]" aria-label="full star" />
  {/each}

  {#if hasHalfStar}
    <StarHalf class="mr-1 w-4 h-4 fill-[#FFC107]" aria-label="half star" />
  {/if}

  {#each Array(emptyStars) as _}
    <Star class="mr-1 w-4 h-4" aria-label="empty star" />
  {/each}
</div>
