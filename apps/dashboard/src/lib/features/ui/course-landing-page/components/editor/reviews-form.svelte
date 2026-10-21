<script lang="ts">
  import get from 'lodash/get';
  import cloneDeep from 'lodash/cloneDeep';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import UserIcon from '@lucide/svelte/icons/user';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Button } from '@cio/ui/base/button';
  import ReviewFormEditor from './review-form-editor.svelte';
  import { isEmptyReview, validateReview } from '../../utils';
  import * as Avatar from '@cio/ui/base/avatar';
  import { t } from '$lib/utils/functions/translations';
  import type { Course } from '$features/course/utils/types';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let reviews = $state(cloneDeep(get(course, 'metadata.reviews', [])));
  let reviewToExpand = $state<number | null>(null);
  let errors = $state({});
  let reviewIdSequence = 0;

  function nextReviewId() {
    reviewIdSequence += 1;
    return Date.now() + reviewIdSequence;
  }

  function addReviewForm() {
    const reviewId = nextReviewId();
    const newReview = {
      id: reviewId,
      hide: false,
      name: '',
      avatar_url: '',
      rating: 1,
      created_at: Date.now(),
      description: ''
    };
    reviews = [...reviews, newReview];
    reviewToExpand = reviewId;
    syncReviews();
  }

  function removeReview(id: number) {
    reviews = reviews.filter((review) => review.id !== id);
  }

  function onExpand(id: number) {
    errors = {};

    if (id === reviewToExpand) {
      const openReview = reviews.find((review) => review.id === id);

      if (isEmptyReview(openReview)) {
        removeReview(id);
        reviewToExpand = null;
        return;
      }

      const validationRes = validateReview(openReview);
      if (Object.keys(validationRes).length) {
        errors = validationRes;
        return;
      }

      reviewToExpand = null;
      return;
    }

    reviewToExpand = id;
  }

  function syncReviews() {
    setter($state.snapshot(reviews), 'metadata.reviews');
  }
</script>

<!-- Sections - Reviews -->
<section id="reviews">
  <div class="">
    {#each reviews || [] as review, index (review.id)}
      <div
        id={String(review.id)}
        class="relative my-2.5 flex flex-col items-center rounded-lg border border-gray-300 p-2"
      >
        {#if review.id !== reviewToExpand}
          <!-- the headers -->
          <div class="flex w-full items-center justify-between">
            <Avatar.Root class="mt-1 h-10 w-10">
              {#if review.avatar_url}
                <Avatar.Image src={review.avatar_url} alt={review.name ? review.name : 'Reviewer'} />
              {/if}
              <Avatar.Fallback>
                <UserIcon class="ui:text-muted-foreground size-5" />
              </Avatar.Fallback>
            </Avatar.Root>
            <p class="text-sm">{review.name}</p>

            <IconButton onclick={() => onExpand(review.id)}>
              <ChevronDownIcon size={16} />
            </IconButton>
          </div>
        {/if}
        <!-- the body -->
        {#if review.id === reviewToExpand}
          <ReviewFormEditor bind:reviews bind:review={reviews[index]} {errors} {onExpand} onChange={syncReviews} />
        {/if}
      </div>
    {/each}

    <!-- create reviews button -->
    <Button class="mt-8" onclick={addReviewForm}>
      {$t('course.navItem.landing_page.editor.reviews_form.add_reviews')}
    </Button>
  </div>
</section>
