<script lang="ts">
  import get from 'lodash/get';
  import { onMount, onDestroy } from 'svelte';
  import pluralize from 'pluralize';
  import { page } from '$app/stores';
  import Notebook from 'carbon-icons-svelte/lib/Notebook.svelte'; //note
  import PresentationFile from 'carbon-icons-svelte/lib/PresentationFile.svelte'; // exercise
  import Video from 'carbon-icons-svelte/lib/Video.svelte'; //video
  import PageNumber from 'carbon-icons-svelte/lib/PageNumber.svelte';
  import PlayFilled from 'carbon-icons-svelte/lib/PlayFilled.svelte';
  import PricingSection from './components/PricingSection.svelte';
  import { observeIntersection } from './components/IntersectionObserver';
  import { getLectureNo } from '../Course/function';
  import { NAV_ITEMS } from './constants';
  import Modal from '../Modal/index.svelte';
  import { handleOpenWidget, reviewsModalStore } from './store';
  import Chip from '../Chip/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getEmbedId } from '$lib/utils/functions/formatYoutubeVideo';
  import type { Course, Lesson, Review } from '$lib/utils/types';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { currentOrg } from '$lib/utils/store/org';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import { course } from '$lib/components/Course/store';

  export let editMode = false;
  export let courseData: Course;
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
  let startCoursePayment = false;
  let isVisible = false;
  let observer: { destroy: () => void };

  // initialize the expandDescription array with 'false' values for each review.
  let expandDescription = Array(reviews.length).fill(false);

  let activeNav = NAV_ITEMS[0].key;
  let instructor = {};
  let video: string | undefined;

  function playVideo() {
    console.log('open modal with video');
  }

  function locationHashChanged() {
    activeNav = window.location.hash;
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
    const targetNode = document.querySelector('.target-component');
    observer = observeIntersection(targetNode, (inView: boolean) => {
      isVisible = inView;
    });
  });

  onDestroy(() => {
    observer?.destroy();
  });

  $: video = get(courseData, 'metadata.videoUrl');
  $: allowNewStudent = get(courseData, 'metadata.allowNewStudent');
  $: bannerImage = get(courseData, 'logo');
  $: lessons = get(courseData, 'lessons', []);
  $: instructor = get(courseData, 'metadata.instructor') || {};
  $: initPlyr(player, video);
  $: {
    reviews = get(courseData, 'metadata.reviews') || [];
    totalRatings = reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0);
    averageRating = totalRatings / reviews?.length;
  }
  $: {
    let imgurl = get(instructor, 'imgUrl', $currentOrg.avatar_url);
    console.log({ imgurl, instructor, org: $currentOrg });
  }
</script>

<div class="flex w-full flex-col items-center bg-white dark:bg-black">
  <!-- Header Section -->
  <header id="header" class="banner p- flex w-full items-center justify-center">
    <div class="flex w-full flex-col-reverse items-center justify-between md:w-5/6 md:flex-row">
      <!-- Course Description -->
      <div class="w-11/12 py-10 md:w-2/5">
        <h1 class="my-4 text-5xl font-bold text-white dark:text-white">
          {get(courseData, 'title', '')}
        </h1>
        <p class="text-md mb-6 text-white dark:text-white">
          {get(courseData, 'description', '')}
        </p>

        <p class="author my-3 text-sm dark:text-white">
          {get(courseData, 'metadata.instructor.name', '')}
        </p>
        <PrimaryButton
          label="Start Course"
          className="px-6 py-5 mt-6 sm:w-fit hidden md:block"
          onClick={() => {
            if (editMode) return;
            startCoursePayment = true;
          }}
          isDisabled={!allowNewStudent}
        />
        {#if $handleOpenWidget.open}
          <UploadWidget bind:imageURL={$course.logo} />
        {/if}
      </div>

      <!-- Banner Image getEmbedId(videoUrl) -->
      {#if video}
        <div class="banner-image flex w-full md:w-2/3">
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
        <div class="banner-image relative overflow-hidden rounded-md md:w-2/3">
          <img
            style="min-width:280px; min-height:200px"
            alt="About us"
            src={bannerImage ? bannerImage : '/images/classroomio-course-img-template.jpg'}
            class="relative mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md md:mt-0"
          />
        </div>

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
  <!-- Body -->
  <div class="w-full bg-white dark:bg-black">
    <div
      class="mx-0 my-2 flex w-full max-w-[1200px] flex-col-reverse items-center justify-between lg:m-auto lg:w-11/12 lg:flex-row lg:items-start lg:py-8"
    >
      <!-- Course Details -->
      <div class="course-content w-full p-3 lg:mr-10 lg:w-10/12">
        <!-- Navigation -->

        <nav
          class="sticky top-0 flex items-center border-b border-gray-300 py-3 {!editMode &&
            'lg:top-11'} bg-white dark:bg-neutral-800"
        >
          {#each NAV_ITEMS as navItem}
            <a
              href="{$page.url.pathname}{navItem.key}"
              class="{navItem.key === activeNav &&
                'active text-primary-700'} z-0 mr-6 rounded-lg px-2 font-normal text-slate-700 hover:bg-gray-200 dark:text-white dark:hover:text-slate-900"
            >
              {navItem.label}
            </a>
          {/each}
        </nav>

        <!-- Sections - Requirement -->
        <section id="requirement" class="mt-8 border-b border-gray-300 pb-10">
          <h3 class="mb-3 mt-0 text-2xl font-bold">Requirement</h3>
          <ul class="list font-light">
            <HtmlRender content={get(courseData, 'metadata.requirements', '')} />
          </ul>
        </section>

        <!-- Sections - Course Description -->
        <section id="description" class="mt-8 border-b border-gray-300 pb-10">
          <h3 class="mb-3 mt-0 text-2xl font-bold">Course Description</h3>
          <HtmlRender
            className="dark:text-white text-sm font-light"
            content={get(courseData, 'metadata.description', '')}
          />
        </section>

        <!-- Sections - Goal -->
        <section id="goals" class="mt-8 pb-10">
          <h3 class="mb-3 mt-0 text-2xl font-bold">What you'll learn</h3>
          <ul class="list font-light">
            <HtmlRender content={get(courseData, 'metadata.goals', '')} />
          </ul>
        </section>

        <!-- Sections - Certificate -->
        <section class="mt-8 border-b border-gray-300 pb-10">
          <h3 class="mt-0 text-2xl font-bold">Certificate</h3>
          <p class="mb-3 text-sm font-light dark:text-white">
            When you complete all of the courses in the program, you'll earn a Certificate to share
            with your professional network.
          </p>
          <img src="/images/certificate-template.svg" alt="certificate template" />
        </section>

        <!-- Sections - Lessons -->
        <section id="lessons" class="mt-8 border-b border-gray-300 pb-10">
          <div class="mb-3 flex w-full items-center justify-between">
            <h3 class="mb-3 mt-0 text-2xl font-bold">Course Content</h3>
            <p class="text-sm font-light dark:text-white">
              <!-- {lessons.length} lessons -->
              {pluralize('lesson', lessons.length, true)}
            </p>
          </div>
          {#each lessons as lesson, index}
            <div class="mb-6 flex w-full flex-col justify-between md:flex-row md:items-center">
              <div class="mb-3 flex items-center">
                <Chip
                  value={getLectureNo(index + 1, '0')}
                  className="bg-primary-100 text-primary-700"
                />
                <p class="ml-2 text-sm font-light dark:text-white">
                  {lesson.title}
                </p>
              </div>

              <div class="w-2/4">
                <div class="flex items-center">
                  {#if lesson.slide_url}
                    <span class="flex w-2/4 text-sm font-light"
                      ><PresentationFile size={16} class="mr-1" />1 slide</span
                    >
                  {/if}
                  {#if lesson.note}
                    <span class="flex w-2/4 text-sm font-light"
                      ><Notebook size={16} class="mr-1" />note</span
                    >
                  {/if}
                </div>
                <div class="flex items-center">
                  {#if lesson.videos}
                    <span class="flex w-2/4 text-sm font-light"
                      ><Video size={16} class="mr-1" />{lesson.videos.length} video{lesson.videos
                        .length > 1
                        ? 's'
                        : ''}
                    </span>
                  {/if}
                  {#if get(lesson, 'totalExercises[0].count')}
                    <span class="flex w-2/4 text-sm font-light"
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
            <h2 class="my-16 mb-6 ml-0 mr-0 font-semibold">Reviews</h2>
            <div class="flex flex-wrap">
              {#each reviews.slice(0, 4) as review, id}
                {#if !review.hide}
                  <!-- review -->
                  <div class="item-start my-2 flex w-2/4 flex-row">
                    <!-- image container -->
                    {#if review.avatar_url}
                      <Avatar src={review.avatar_url} name="Avatar" className="mt-1" />
                    {/if}

                    <!-- profile content -->
                    <div class="w-11/12 pl-2.5">
                      <p class="mb-0.5 font-medium">{review.name}</p>
                      <!-- ratings -->
                      <div class="flex flex-row items-center">
                        {#if review.rating}
                          <img src={ratingsImg[review.rating - 1]} class="mr-4 mt-1 w-24" alt="" />
                        {/if}
                      </div>
                      <div
                        class="read-more-content mb-2"
                        style="max-height: {expandDescription[id] ? 'none' : '50px'}"
                      >
                        <p class="my-2 text-sm leading-5 text-gray-600">
                          {review.description}
                        </p>
                      </div>
                      {#if !expandDescription[id] && review.description.split(' ').length > 9}
                        <button
                          class="text-primary-700 mt-2 font-normal underline"
                          on:click={() => toggleDescription(id)}>See More</button
                        >
                      {/if}
                      {#if expandDescription[id]}
                        <button
                          class="text-primary-700 mt-2 font-normal underline"
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
                  <h2 class="mt-2 text-lg font-semibold">
                    {reviews.length} Ratings
                  </h2>
                </div>
                <!-- reviews -->
                <div class="flex w-4/6 flex-wrap">
                  {#each reviews as review, id}
                    <!-- review -->
                    <div class="item-start my-2 flex w-full flex-row">
                      <!-- image container -->
                      {#if review.avatar_url}
                        <Avatar src={review.avatar_url} name={review.name} className="mt-1" />
                      {/if}

                      <!-- profile content -->
                      <div class="w-11/12 pl-2.5">
                        <p class="mb-0.5 font-medium">{review.name}</p>
                        <!-- ratings -->
                        <div class="flex flex-row">
                          <img src="/images/rating-full.svg" alt="" class="mr-2" />
                          <p class="text-xs text-gray-600">
                            {calDateDiff(review.created_at)}
                          </p>
                        </div>
                        <div
                          class="read-more-content mb-2"
                          style="max-height: {expandDescription[id] ? 'none' : '50px'}"
                        >
                          <p class="my-2 text-sm leading-5 text-gray-600">
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
          <h3 class="mb-3 mt-0 text-2xl font-bold">Instructor</h3>
          <div class="mb-4 flex items-center">
            <img
              alt="Author Avatar"
              class="mr-3 block h-20 w-20 rounded-full"
              src={get(instructor, 'imgUrl', $currentOrg.avatar_url || '/logo-512.png')}
            />
            <div>
              <p class="text-md font-light dark:text-white">
                {get(instructor, 'name', $currentOrg.name)}
              </p>
              <p class="text-xs font-light dark:text-white">
                {get(instructor, 'role', '')}
              </p>
              <p class="text-md flex items-center font-light dark:text-white">
                <PlayFilled size={16} class="text-primary-700" />
                <span class="ml-1">{get(instructor, 'courseNo', 10)} courses</span>
              </p>
            </div>
          </div>

          <p class="text-sm font-light dark:text-white">
            {get(instructor, 'description', '')}
          </p>
        </section>
      </div>

      <!-- Pricing Details -->
      <PricingSection
        {courseData}
        {editMode}
        bind:startCoursePayment
        className="target-component"
      />
    </div>
    {#if !isVisible}
      <PricingSection
        {courseData}
        {editMode}
        bind:startCoursePayment
        mobile={true}
        className="w-full"
      />
    {/if}
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
    min-width: 60%;
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
  @media screen and (max-width: 1023px) {
    .course-content {
      min-width: 80%;
    }
  }
</style>
