<script lang="ts">
  // import paystack from 'paystack';
  import get from 'lodash/get';
  import { onMount } from 'svelte';
  import pluralize from 'pluralize';
  import { page } from '$app/stores';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import Notebook from 'carbon-icons-svelte/lib/Notebook.svelte'; //note
  import PresentationFile from 'carbon-icons-svelte/lib/PresentationFile.svelte'; // exercise
  import Video from 'carbon-icons-svelte/lib/Video.svelte'; //video
  import PageNumber from 'carbon-icons-svelte/lib/PageNumber.svelte';
  import PlayFilled from 'carbon-icons-svelte/lib/PlayFilled.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import PricingSection from './components/PricingSection.svelte';
  import { getLectureNo } from '../Course/function';
  import { NAV_ITEMS } from './constants';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import Chip from '../Chip/index.svelte';
  import { getEmbedId } from '$lib/utils/functions/formatYoutubeVideo';
  import type { Course, Lesson, Review } from '$lib/utils/types';
  import Modal from '../Modal/index.svelte';
  import { reviewsModalStore } from './store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  dayjs.extend(relativeTime);

  export let courseData: Course = {
    id: '',
    title: '',
    description: ''
  };
  const ratingsImg = [
    '/images/rating-1.svg',
    '/images/rating-2.svg',
    '/images/rating-3.svg',
    '/images/rating-4.svg',
    '/images/rating-5.svg'
  ];

  let lessons: Array<Lesson> = [];
  let reviews: Review[] = [];
  let player: any;
  let averageRating = 0;
  let totalRatings = 0;

  // initialize the expandDescription array with 'false' values for each review.
  let expandDescription = Array(reviews.length).fill(false);

  // const paystackApi = paystack('');

  let activeNav = NAV_ITEMS[0].key;
  let instructor = {};
  let video: string | undefined;

  function playVideo() {
    console.log('open modal with video');
  }

  function locationHashChanged() {
    activeNav = window.location.hash;
  }

  function addToCart() {}

  function buyNow() {
    // if (courseData.cost) {
    //   paystackApi.tra;
    // } else {
    //   // Course is free
    // }
  }

  function initPlyr(_player: any, _video: string | undefined) {
    if (!player) return;

    // @ts-ignore
    const plyr = new Plyr('#player', {});
    // @ts-ignore
    window.player = plyr;
  }

  function toggleDescription(id: number) {
    expandDescription[id] = !expandDescription[id];
  }

  onMount(() => {
    window.onhashchange = locationHashChanged;
  });

  $: video = get(courseData, 'metadata.videoUrl');
  $: lessons = get(courseData, 'lessons', []);
  $: instructor = courseData?.metadata?.instructor || {};
  $: initPlyr(player, video);
  $: {
    reviews = get(courseData, 'metadata.reviews') || [];
    totalRatings = reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0);
    averageRating = totalRatings / reviews?.length;
  }
</script>

<svelte:head>
  <title>{get(courseData, 'title', '')}</title>
</svelte:head>

<div class="w-full bg-white dark:bg-gray-800 flex flex-col items-center">
  <!-- Header Section -->
  <header id="header" class="banner w-full flex items-center justify-center p-">
    <div class="md:w-5/6 w-full flex items-center justify-between flex-col-reverse md:flex-row">
      <!-- Course Description -->
      <div class="md:w-2/5 w-11/12 py-10">
        <h1 class="dark:text-white text-5xl text-white my-4 font-bold">
          {get(courseData, 'title', '')}
        </h1>
        <p class="dark:text-white text-md text-white mb-6">
          {get(courseData, 'description', '')}
        </p>

        <p class="dark:text-white author my-3 text-sm">
          {get(courseData, 'metadata.instructor.name', '')}
        </p>
        <PrimaryButton label="Start Course" className="px-6 py-5 mt-6 sm:w-fit" />
      </div>

      <!-- Banner Image getEmbedId(videoUrl) -->
      {#if video}
        <div class="banner-image md:w-2/3 w-full flex">
          <div
            bind:this={player}
            id="player"
            data-plyr-provider="youtube"
            data-plyr-embed-id={getEmbedId(video)}
          />
        </div>
        <!-- <div class="container">
          <div
            bind:this={player}
            id="player"
            class="banner-image w-2/3 h-96 relative"
            data-plyr-provider="youtube"
            data-plyr-embed-id="bTqVqk7FSmY"
          />
        </div> -->
      {:else}
        <!-- <div
          class="banner-image w-2/3 h-96 relative cursor-pointer"
          on:click={playVideo}
        >
          <div
            aria-hidden="true"
            class="absolute top-0 left-0 backdrop w-full h-full"
          />
          <img
            src="/images/course-banner-image.png"
            alt="banner"
            class="w-full h-full"
          />
          <div
            class="absolute top-0 left-0 w-full h-full z-50 flex items-center justify-center"
          >
            <img src="/images/play_video.png" alt="play video" />
          </div>
        </div> -->
      {/if}
    </div>
  </header>
  <PricingSection className="md:hidden" {courseData} />
  <!-- Body -->
  <div class="bg-white dark:bg-gray-800 w-full">
    <div class="py-8 lg:w-10/12 w-full m-2 lg:m-auto flex justify-between">
      <!-- Course Details -->
      <div class="course-content w-full p-3 md:w-9/12 md:mr-14">
        <!-- Navigation -->
        <nav class="flex items-center border-b border-gray-300 pb-3">
          {#each NAV_ITEMS as navItem}
            <a
              href="{$page.url.pathname}{navItem.key}"
              class="{navItem.key === activeNav &&
                'active text-primary-700'} rounded-lg px-2 mr-6 text-slate-700 font-normal hover:bg-slate-100 hover:text-slate-900 dark:text-white"
            >
              {navItem.label}
            </a>
          {/each}
        </nav>

        <!-- Sections - Requirement -->
        <section id="requirement" class="border-b border-gray-300 mt-8 pb-10">
          <h3 class="text-2xl font-bold mt-0 mb-3">Requirement</h3>
          <ul class="list font-light">
            {@html get(courseData, 'metadata.requirements', '')}
          </ul>
        </section>

        <!-- Sections - Course Description -->
        <section id="description" class="border-b border-gray-300 mt-8 pb-10">
          <h3 class="text-2xl font-bold mt-0 mb-3">Course Description</h3>
          <p class="dark:text-white text-sm font-light">
            {@html get(courseData, 'metadata.description', '')}
          </p>
        </section>

        <!-- Sections - Goal -->
        <section id="goals" class="mt-8 pb-10">
          <h3 class="text-2xl font-bold mt-0 mb-3">What you'll learn</h3>
          <ul class="list font-light">
            {@html get(courseData, 'metadata.goals', '')}
          </ul>
        </section>

        <!-- Sections - Certificate -->
        <section class="border-b border-gray-300 mt-8 pb-10">
          <h3 class="text-2xl font-bold mt-0">Certificate</h3>
          <p class="dark:text-white text-sm font-light mb-3">
            When you complete all of the courses in the program, you'll earn a Certificate to share
            with your professional network.
          </p>
          <img src="/images/certificate-template.svg" alt="certificate template" />
        </section>

        <!-- Sections - Lessons -->
        <section id="lessons" class="border-b border-gray-300 mt-8 pb-10">
          <div class="flex items-center justify-between w-full mb-3">
            <h3 class="text-2xl font-bold mt-0 mb-3">Course Content</h3>
            <p class="dark:text-white text-sm font-light">
              <!-- {lessons.length} lessons -->
              {pluralize('lesson', lessons.length, true)}
            </p>
          </div>
          {#each lessons as lesson, index}
            <div class="w-full flex md:items-center justify-between mb-6 flex-col md:flex-row">
              <div class="flex items-center mb-3">
                <Chip
                  value={getLectureNo(index + 1, '0')}
                  className="bg-primary-100 text-primary-700"
                />
                <p class="dark:text-white ml-2 text-sm font-light">
                  {lesson.title}
                </p>
              </div>

              <div class="w-2/4">
                <div class="flex items-center">
                  {#if lesson.slide_url}
                    <span class="text-sm font-light flex w-2/4"
                      ><PresentationFile size={16} class="mr-1" />1 slide</span
                    >
                  {/if}
                  {#if lesson.note}
                    <span class="text-sm font-light flex w-2/4"
                      ><Notebook size={16} class="mr-1" />1 note</span
                    >
                  {/if}
                </div>
                <div class="flex items-center">
                  {#if lesson.videos}
                    <span class="text-sm font-light flex w-2/4"
                      ><Video size={16} class="mr-1" />{lesson.videos.length} video{lesson.videos
                        .length > 1
                        ? 's'
                        : ''}
                    </span>
                  {/if}
                  {#if get(lesson, 'totalExercises[0].count')}
                    <span class="text-sm font-light flex w-2/4"
                      ><PageNumber size={16} class="mr-1" />{pluralize(
                        'exercise',
                        get(lesson, 'totalExercises[0].count', 0),
                        true
                      )}</span
                    >
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </section>

        <!-- Sections - Reviews -->
        {#if reviews && reviews.length > 0}
          <section id="reviews">
            <h2 class="my-16 mr-0 mb-6 ml-0 font-semibold">Reviews</h2>
            <div class="flex flex-wrap">
              {#each reviews.slice(0, 4) as review, id}
                {#if !review.hide}
                  <!-- review -->
                  <div class="flex flex-row item-start w-2/4 my-2">
                    <!-- image container -->
                    {#if review.avatar_url}
                      <Avatar src={review.avatar_url} name="Avatar" className="mt-1" />
                    {/if}

                    <!-- profile content -->
                    <div class="pl-2.5 w-11/12">
                      <p class="mb-0.5 font-medium">{review.name}</p>
                      <!-- ratings -->
                      <div class="flex flex-row items-center">
                        {#if review.rating}
                          <img src={ratingsImg[review.rating - 1]} class="w-24 mr-4 mt-1" alt="" />
                        {/if}
                      </div>
                      <div
                        class="read-more-content mb-2"
                        style="max-height: {expandDescription[id] ? 'none' : '50px'}"
                      >
                        <p class="text-sm my-2 leading-5 text-gray-600">
                          {review.description}
                        </p>
                      </div>
                      {#if !expandDescription[id] && review.description.split(' ').length > 9}
                        <button
                          class="underline text-primary-700 mt-2 font-normal"
                          on:click={() => toggleDescription(id)}>See More</button
                        >
                      {/if}
                      {#if expandDescription[id]}
                        <button
                          class="underline text-primary-700 mt-2 font-normal"
                          on:click={() => toggleDescription(id)}>See Less</button
                        >
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
            {#if reviews.length > 4}
              <PrimaryButton
                label="See All"
                className="w-3/12 p-4 mt-2"
                variant={VARIANTS.OUTLINED}
                onClick={() => ($reviewsModalStore.open = true)}
              />
            {/if}

            <!-- Reviews Modal -->
            <Modal
              onClose={() => ($reviewsModalStore.open = false)}
              bind:open={$reviewsModalStore.open}
              width="w-9/12"
              modalHeading="Reviews"
            >
              <div class="flex">
                <!-- ratings -->
                <div class="w-1/3">
                  <h2 class="text-xl font-bold">
                    {averageRating} Rating
                  </h2>
                  <h2 class="text-lg font-semibold mt-2">
                    {reviews.length} Ratings
                  </h2>
                </div>
                <!-- reviews -->
                <div class="flex flex-wrap w-4/6">
                  {#each reviews as review, id}
                    <!-- review -->
                    <div class="flex flex-row item-start w-full my-2">
                      <!-- image container -->
                      {#if review.avatar_url}
                        <Avatar src={review.avatar_url} name={review.name} className="mt-1" />
                      {/if}

                      <!-- profile content -->
                      <div class="pl-2.5 w-11/12">
                        <p class="mb-0.5 font-medium">{review.name}</p>
                        <!-- ratings -->
                        <div class="flex flex-row">
                          <img src="/images/rating-full.svg" alt="" class="mr-2" />
                          <p class="text-xs text-gray-600">
                            {dayjs(review.created_at).fromNow(true)} ago
                          </p>
                        </div>
                        <div
                          class="read-more-content mb-2"
                          style="max-height: {expandDescription[id] ? 'none' : '50px'}"
                        >
                          <p class="text-sm my-2 leading-5 text-gray-600">
                            {review.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </Modal>
          </section>
        {/if}

        <!-- Sections - Instructor -->
        <section id="instructor" class="mt-8 pb-10">
          <h3 class="text-2xl font-bold mt-0 mb-3">Instructor</h3>
          <div class="flex items-center mb-4">
            <img
              alt="Author Avatar"
              class="block rounded-full h-20 w-20 mr-3"
              src={get(instructor, 'imgUrl', '')}
            />
            <div>
              <p class="dark:text-white text-md font-light">
                {get(instructor, 'name', '')}
              </p>
              <p class="dark:text-white text-xs font-light">
                {get(instructor, 'role', '')}
              </p>
              <p class="dark:text-white text-md font-light flex items-center">
                <PlayFilled size={16} class="text-primary-700" />
                <span class="ml-1">{get(instructor, 'courseNo', '')} courses</span>
              </p>
            </div>
          </div>

          <p class="dark:text-white text-sm font-light">
            {get(instructor, 'description', '')}
          </p>
        </section>
      </div>

      <!-- Pricing Details -->
      <PricingSection className="hidden md:block" {courseData} />
    </div>
  </div>
</div>

<style lang="scss">
  .banner {
    background-color: #040f2d;
    min-height: 472px;
  }

  .author {
    color: #7888b7;
  }

  .banner-image {
    max-width: 559px;
  }

  .backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .active {
    position: relative;
    display: inline-block;
  }

  .active::after {
    position: absolute;
    content: '';
    width: 100%;
    height: 3px;
    background-color: var(--main-primary-color);
    display: block;
    bottom: -14px;
    left: 0px;
  }

  .price-container {
    width: 405px;
    min-width: 330px;
    height: fit-content;
    position: sticky;
    top: 0;
  }

  .course-content {
    max-width: 608px;
  }

  nav {
    overflow: auto;
    margin: 0;
    overflow-y: hidden;
    width: 100%;
  }

  :global(.list ul li) {
    margin-left: 1rem;
    list-style-type: disc;
  }

  :global(.plyr) {
    width: 100% !important;
  }

  .read-more-content {
    max-height: 100px; /* Adjust this value to set the maximum height for the truncated content */
    overflow: hidden;
    transition: max-height 0.3s ease;
    text-overflow: ellipsis;
  }

  .read-more-button {
    cursor: pointer;
    color: blue;
    text-decoration: underline;
  }
</style>
