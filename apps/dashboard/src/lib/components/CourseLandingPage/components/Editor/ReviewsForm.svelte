<script lang="ts">
  import get from 'lodash/get';
  import z from 'zod';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import { IconButton } from '$lib/components/IconButton';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { Button } from '@cio/ui/base/button';
  import ReviewFormEditor from './ReviewFormEditor.svelte';
  import * as Avatar from '@cio/ui/base/avatar';
  import { processErrors } from '$lib/utils/functions/validator';
  import { shortenName } from '$lib/utils/functions/string';
  import { t } from '$lib/utils/functions/translations';
  import type { Course } from '$lib/utils/types';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let reviews = $state(get(course, 'metadata.reviews', []));
  let reviewToExpand = $state<number | null>(null);
  let errors = $state({});

  function addReviewForm() {
    const _review = {
      id: new Date().getTime(),
      hide: false,
      name: '',
      avatar_url: '',
      rating: 1,
      created_at: new Date().getTime(),
      description: ''
    };
    reviews = [...reviews, _review];
    reviewToExpand = _review.id;
  }

  function validateReviews(id) {
    const review = reviews.find((r) => r.id === id);
    const reviewSchema = z.object({
      name: z.string().min(5, {
        message: `${$t('course.navItem.landing_page.editor.reviews_form.validations.name.min_char')}`
      }),
      avatar_url: z.string().min(6, {
        message: `${$t('course.navItem.landing_page.editor.reviews_form.validations.avatar_url.message')}`
      }),
      rating: z
        .number()
        .min(1, {
          message: `${$t('course.navItem.landing_page.editor.reviews_form.validations.rating.message')}`
        })
        .max(5, {
          message: `${$t('course.navItem.landing_page.editor.reviews_form.validations.rating.message')}`
        }),
      description: z.string().min(10, {
        message: `${$t('course.navItem.landing_page.editor.reviews_form.validations.description.min_char')}`
      })
    });

    const { error } = reviewSchema.safeParse(review);
    return processErrors(error);
  }

  function onExpand(id) {
    errors = {};

    if (reviewToExpand) {
      const validationRes = validateReviews(reviewToExpand);
      if (Object.keys(validationRes).length) {
        errors = Object.assign(errors, validationRes);
        return;
      }
    }

    if (id === reviewToExpand) {
      reviewToExpand = null;
      return;
    }

    reviewToExpand = id;
  }

  $effect(() => {
    setter(reviews, 'metadata.reviews');
  });
</script>

<!-- Sections - Reviews -->
<section id="reviews">
  <div class="">
    {#each reviews || [] as review, index}
      <div
        id={String(review.id)}
        class="relative my-2.5 flex flex-col items-center rounded-lg border border-gray-300 p-2"
      >
        {#if review.id !== reviewToExpand}
          <!-- the headers -->
          <div class="flex w-full items-center justify-between">
            <Avatar.Root class="mt-1 h-10 w-10">
              <Avatar.Image
                src={review.avatar_url ? review.avatar_url : '/logo-192.png'}
                alt={review.name ? review.name : 'Reviewer'}
              />
              <Avatar.Fallback>{shortenName(review.name) || 'R'}</Avatar.Fallback>
            </Avatar.Root>
            <p class="text-sm">{review.name}</p>

            <IconButton value="expand" onClick={() => onExpand(review.id)} size={$isMobile ? 'large' : 'small'}>
              <ChevronDownIcon size={16} />
            </IconButton>
          </div>
        {/if}
        <!-- the body -->
        {#if review.id === reviewToExpand}
          <ReviewFormEditor bind:reviews bind:review={reviews[index]} {errors} courseId={course.id} {onExpand} />
        {/if}
      </div>
    {/each}

    <!-- create reviews button -->
    <Button
      class="mt-8"
      onclick={addReviewForm}
    >
      {$t('course.navItem.landing_page.editor.reviews_form.add_reviews')}
    </Button>
  </div>
</section>
