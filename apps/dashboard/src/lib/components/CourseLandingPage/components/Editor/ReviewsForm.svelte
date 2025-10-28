<script>
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import set from 'lodash/set';
  import z from 'zod';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import ReviewFormEditor from './ReviewFormEditor.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { processErrors } from '$lib/utils/functions/validator';
  import { t } from '$lib/utils/functions/translations';

  export let course = {};

  let reviews = get(course, 'metadata.reviews', []);
  let reviewToExpand = null;
  let errors = {};

  function setter(value, setterKey) {
    if (!value) return;

    const _course = cloneDeep(course);
    set(_course, setterKey, value);
    course = _course;
  }

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
        message: `${$t(
          'course.navItem.landing_page.editor.reviews_form.validations.name.min_char'
        )}`
      }),
      avatar_url: z.string().min(6, {
        message: `${$t(
          'course.navItem.landing_page.editor.reviews_form.validations.avatar_url.message'
        )}`
      }),
      rating: z
        .number()
        .min(1, {
          message: `${$t(
            'course.navItem.landing_page.editor.reviews_form.validations.rating.message'
          )}`
        })
        .max(5, {
          message: `${$t(
            'course.navItem.landing_page.editor.reviews_form.validations.rating.message'
          )}`
        }),
      description: z.string().min(10, {
        message: `${$t(
          'course.navItem.landing_page.editor.reviews_form.validations.description.min_char'
        )}`
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

  $: setter(reviews, 'metadata.reviews');
</script>

<!-- Sections - Reviews -->
<section id="reviews">
  <div class="">
    {#each reviews || [] as review}
      <div
        id={review.id}
        class="relative my-2.5 flex flex-col items-center rounded-lg border border-gray-300 p-2"
      >
        {#if review.id !== reviewToExpand}
          <!-- the headers -->
          <div class="flex w-full items-center justify-between">
            <Avatar src={review.avatar_url} name={review.name} className="mt-1" />
            <p class="text-sm">{review.name}</p>

            <IconButton
              value="expand"
              onClick={() => onExpand(review.id)}
              size={$isMobile ? 'large' : 'small'}
            >
              <ChevronDownIcon size={16} class="carbon-icon dark:text-white" />
            </IconButton>
          </div>
        {/if}
        <!-- the body -->
        {#if review.id === reviewToExpand}
          <ReviewFormEditor bind:reviews bind:review {errors} courseId={course.id} {onExpand} />
        {/if}
      </div>
    {/each}

    <!-- create reviews button -->
    <PrimaryButton
      label={$t('course.navItem.landing_page.editor.reviews_form.add_reviews')}
      variant={VARIANTS.CONTAINED}
      onClick={addReviewForm}
      className="w-5 rounded-md mt-8"
    />
  </div>
</section>
