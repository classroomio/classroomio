<script lang="ts">
  import get from 'lodash/get';
  import { page } from '$app/stores';
  import { onDestroy } from 'svelte';
  import { ChevronDown } from 'carbon-icons-svelte';
  import Badge from 'carbon-icons-svelte/lib/Badge.svelte';
  import PlayFilled from 'carbon-icons-svelte/lib/PlayFilled.svelte';
  import ChartEvaluation from 'carbon-icons-svelte/lib/ChartEvaluation.svelte';

  import { pathway } from '../../store';
  import { currentOrg } from '$lib/utils/store/org';
  import { handleOpenWidget, reviewsModalStore } from './store';

  import { timeAgo } from '../../functions';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { getEmbedId } from '$lib/utils/functions/formatYoutubeVideo';

  import { NAV_ITEMS } from './constants';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import type { Pathway, PathwayCourse, Review } from '$lib/utils/types';

  import Modal from '$lib/components/Modal/index.svelte';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import PricingSection from './components/PricingSection.svelte';
  import PoweredBy from '$lib/components/Upgrade/PoweredBy.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import UploadWidget from '$lib/components/UploadWidget/index.svelte';
  import CourseIcon from '$lib/components/Icons/CourseIcon.svelte';

  export let editMode = false;
  export let pathwayData: Pathway;
  const ratingsImg = [
    '/images/rating-1.svg',
    '/images/rating-2.svg',
    '/images/rating-3.svg',
    '/images/rating-4.svg',
    '/images/rating-5.svg'
  ];

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

  function needsTruncation(text: string, maxWords: number = 12) {
    return text.split(' ').length > maxWords;
  }

  onDestroy(() => {
    observer?.destroy();
  });

  $: video = get(pathwayData, 'metadata.videoUrl');
  $: allowNewStudent = get(pathwayData, 'metadata.allowNewStudent');
  $: bannerImage = get(pathwayData, 'logo');
  $: instructor = get(pathwayData, 'metadata.instructor') || {};
  $: initPlyr(player, video);
  $: {
    reviews = get(pathwayData, 'metadata.reviews') || [];
    totalRatings = reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0);
    averageRating = totalRatings / reviews?.length;
  }
  $: {
    let imgurl = get(instructor, 'imgUrl', $currentOrg.avatar_url);
    console.log({ imgurl, instructor, org: $currentOrg });
  }
</script>

{#if !editMode}
  <PoweredBy />
{/if}

<div class="flex w-full flex-col items-center bg-white dark:bg-black">
  <!-- Header Section -->
  <header id="header" class="banner p-10 flex w-full items-center justify-center">
    <div class="flex w-full flex-col-reverse items-center justify-between md:flex-row">
      <!-- Course Description -->
      <div class="w-11/12 py-10 md:w-2/5">
        <div
          class="flex gap-2 items-center w-fit px-2 py-1 rounded-md font-medium text-[10px] tracking-widest bg-[#D9E0F5] border-[#0233BD] border"
        >
          <img src="/learningpath-icon.svg" alt="" class="w-3.5" />
          {$t('pathway.pages.landingPage.header.tag')}
        </div>
        <h1 class="my-4 text-5xl font-bold text-[#040f2d] dark:text-white">
          {get(pathwayData, 'title', '')}
        </h1>
        <p class="text-base mb-6 text-[#040f2d] dark:text-white">
          {get(pathwayData, 'description', '')}
        </p>
        <PrimaryButton
          label={$t('pathway.pages.landingPage.header.button')}
          className="px-6 py-5 mt-6 sm:w-fit hidden md:block"
          onClick={() => {
            if (editMode) return;
            startCoursePayment = true;
          }}
          isDisabled={!allowNewStudent}
        />
        {#if $handleOpenWidget.open}
          <UploadWidget bind:imageURL={$pathway.logo} />
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
        <div class="banner-image relative overflow-hidden rounded-md md:w-[60%]">
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

  <!-- Blue Banner -->
  <div
    class="bg-[#1D4ED8] text-white py-8 px-10 w-full flex flex-wrap gap-y-5 items-center justify-between"
  >
    <div class="flex gap-4 items-center w-full min-w-[200px] md:max-w-[30%]">
      <span class="bg-[#D9E0F5] flex justify-center items-center px-3 py-3 rounded-full">
        <CourseIcon color="blue" />
      </span>

      <div>
        <h1 class="text-base m-0">
          {$pathway.pathway_course.length}
          {$t('pathway.pages.landingPage.banner.courses')}
        </h1>
        <p class="text-[12px] font-extralight">
          {$t('pathway.pages.landingPage.banner.courses_text')}
        </p>
      </div>
    </div>

    <div class="flex gap-4 items-center w-full min-w-[200px] md:max-w-[30%]">
      <span class="bg-[#D9E0F5] flex justify-center items-center px-3 py-3 rounded-full">
        <Badge size={20} color="blue" />
      </span>

      <div>
        <h1 class="text-base m-0">{$t('pathway.pages.landingPage.banner.certificate')}</h1>
        <p class="text-[12px] font-extralight">{$t('pathway.pages.landingPage.banner.share')}</p>
      </div>
    </div>

    <div class="flex gap-4 items-center w-full min-w-[200px] md:max-w-[30%]">
      <span class="bg-[#D9E0F5] flex justify-center items-center px-3 py-3 rounded-full">
        <ChartEvaluation color="blue" size={16} />
      </span>

      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-base m-0">4.8</h1>
          <img src="/starRating-icon.svg" alt="" class="w-28" />
        </div>
        <p class="text-[12px] font-extralight">{$t('pathway.pages.landingPage.banner.rating')}</p>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="w-full bg-white dark:bg-black">
    <div class="flex w-full items-center justify-between">
      <!-- Course Details -->
      <div class="w-full">
        <!-- Navigation -->
        <nav
          class="sticky top-0 flex justify-between items-center border-b border-gray-300 px-10 py-9 {!editMode &&
            'lg:top-11'} bg-white dark:bg-neutral-800"
        >
          {#each NAV_ITEMS as navItem}
            <a
              href="{$page.url.pathname}{navItem.key}"
              class="{navItem.key === activeNav &&
                'active text-primary-700'} z-0 mr-6 rounded-md px-2 py-1 font-bold text-slate-700 hover:bg-gray-200 dark:text-white dark:hover:text-slate-900"
            >
              {$t(navItem.label)}
            </a>
          {/each}
        </nav>

        <!-- Main -->
        <div class="flex justify-between items-center px-10">
          <!-- Sections - Description & Objectives -->
          <div class="max-w-[55%]">
            <!-- Sections - About -->
            <section id="requirement" class="mt-8 border-gray-300">
              <h3 class="mb-3 mt-0 text-2xl font-bold">
                {$t('pathway.pages.landingPage.main.description')}
              </h3>

              <ul class="font-light">
                <HtmlRender content={get(pathwayData, 'metadata.about', '')} />
              </ul>
            </section>

            <!-- Sections - Course Objectives -->
            <section id="description" class="mt-20 border-gray-300 landingpage-list">
              <h3 class="mb-3 mt-0 text-2xl font-bold">
                {$t('pathway.pages.landingPage.main.objectives')}
              </h3>

              <div>
                <HtmlRender
                  className="dark:text-white w-full font-light"
                  content={get(pathwayData, 'metadata.objectives', '')}
                />
              </div>
            </section>
          </div>

          <!-- Pricing Details -->
          <PricingSection {pathwayData} {editMode} bind:startCoursePayment />
        </div>

        <!-- Sections - Certificate -->
        <section
          class="border-gray-300 mt-8 flex justify-between max-w-[80%] mx-auto bg-[#F5F8FE] items-center px-8 py-4"
        >
          <div class="w-[50%]">
            <h3 class="text-2xl font-bold m-0">
              {$t('pathway.pages.landingPage.certificate.earn')}
            </h3>
            <p class="dark:text-white text-sm font-light mt-1">
              {$t('pathway.pages.landingPage.certificate.evidence')}
            </p>
          </div>
          <img src="/images/certificate-template.svg" alt="certificate template" />
        </section>

        <!-- Sections - Pathway Subheader -->
        <div class="flex justify-between pl-12 pr-16 my-8 sticky top-0 bg-white py-6">
          <h1 class="text-lg">{get(pathwayData, 'title', '')}</h1>
          <PrimaryButton
            label="{$t('pathway.pages.landingPage.subHeader.button')} {get(
              pathwayData,
              'enrollment_date',
              ''
            )}"
            className="md:w-[30%] w-full py-3 mb-3 font-semibold"
            isDisabled={!pathwayData.landingpage.allowNewStudent}
          />
        </div>

        <!-- Sections - Course List -->
        <section class="text-center max-w-[80%] mx-auto">
          <h1 class="mb-1">
            {$t('pathway.pages.landingPage.courseList.header')} 6 {$t(
              'pathway.pages.landingPage.courseList.courses'
            )}
          </h1>
          <p class="text-sm text-[#656565] max-w-[83%] mx-auto">
            {$t('pathway.pages.landingPage.courseList.subheader')}
          </p>

          <!-- course list -->
          <div class="border p-5 rounded-lg shadow-md mt-10">
            {#each $pathway.pathway_course as course}
              <div
                class="py-3 px-10 flex justify-between items-center course-list-border hover:bg-[#F7F7F7] transition-all duration-300"
              >
                <div class="text-left">
                  <h1 class="underline text-base m-0">{course.course.title}</h1>
                  <div class="flex items-center gap-1 text-xs my-1">
                    <span>
                      {course.course.lesson?.length || 0}
                      {$t('pathway.pages.landingPage.courseList.lessons')}
                    </span>
                    -
                    <span>
                      {$t('pathway.pages.landingPage.courseList.estimated')}
                      {course.estimated_hours}
                      {$t('pathway.pages.landingPage.courseList.hours')}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button type="button">{$t('pathway.pages.landingPage.courseList.view')}</button>
                  <ChevronDown color="blue" />
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- Sections - Reviews & Instructor -->
        <div class="flex justify-between items-center py-10 px-8">
          <!-- Sections - Reviews -->
          {#if reviews && reviews.length > 0}
            <section id="reviews" class="w-[60%]">
              <h2 class="m-0 mb-2 font-semibold">
                {$t('course.navItem.landing_page.reviews')}
              </h2>
              <p class="text-sm text-[#656565]">
                {$t('pathway.pages.landingPage.reviews.students')}
              </p>
              <div class="flex flex-wrap gap-y-2 justify-between mt-5">
                {#each reviews.slice(0, 4) as review, id}
                  {#if !review.hide}
                    <!-- review -->
                    <div class="my-2 w-[48%] p-5 rounded-md bg-[#F1F6FF]">
                      <div
                        class="read-more-content {expandDescription[id] ? 'expanded' : ''}"
                        style="max-height: {expandDescription[id] ? '100%' : '40px'}"
                      >
                        <p class="my-2 text-xs text-gray-600">
                          {review.description}
                        </p>
                      </div>

                      {#if needsTruncation(review.description) && !expandDescription[id]}
                        <button
                          class="text-primary-700 text-xs underline"
                          on:click={() => toggleDescription(id)}
                        >
                          {$t('pathway.pages.landingPage.reviews.readMore')}</button
                        >
                      {/if}
                      {#if expandDescription[id]}
                        <button
                          class="text-primary-700 text-xs underline"
                          on:click={() => toggleDescription(id)}
                        >
                          {$t('pathway.pages.landingPage.reviews.readLess')}</button
                        >
                      {/if}

                      <div class="mt-2 flex gap-3 items-center">
                        <!-- image container -->
                        {#if review.avatar_url}
                          <Avatar src={review.avatar_url} name="Avatar" width="w-9" height="h-9" />
                        {/if}

                        <!-- profile content -->
                        <div>
                          <p class="font-semibold text-xs">{review.name}</p>
                          <!-- ratings -->
                          <div class="flex flex-row gap-4 w-full items-center">
                            {#if review.rating}
                              <img src={ratingsImg[review.rating - 1]} class="w-20" alt="" />
                            {/if}

                            <p class="text-[10px] text-gray-600">{timeAgo(review.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/if}
                {/each}
              </div>
              {#if reviews.length > 4}
                <PrimaryButton
                  label={$t('course.navItem.landing_page.see_all')}
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
                modalHeading={$t('course.navItem.landing_page.reviews_modal.title')}
              >
                <div class="flex">
                  <!-- ratings -->
                  <div class="w-1/3">
                    <h2 class="text-xl font-bold">
                      {averageRating}
                      {$t('course.navItem.landing_page.reviews_modal.rating')}
                    </h2>
                    <h2 class="text-lg font-semibold mt-2">
                      {reviews.length}
                      {$t('course.navItem.landing_page.reviews_modal.ratings')}
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
          <section
            id="instructor"
            class="mt-16 p-5 border border-[#EAEAEA] shadow-sm rounded-md w-[35%]"
          >
            <h3 class="text-lg font-bold mt-0 border-b py-2">
              {$t('course.navItem.landing_page.instructor')}
            </h3>
            <div class="flex items-center mb-4">
              <img
                alt="Author Avatar"
                class="mr-3 block h-14 w-14 rounded-full"
                src={get(instructor, 'imgUrl', $currentOrg.avatar_url || '/logo-512.png')}
              />
              <div>
                <p class="text-sm font-light dark:text-white">
                  {get(instructor, 'name', $currentOrg.name)}
                </p>
                <div class="flex gap-2 items-center">
                  <p class="text-[11px] font-medium dark:text-white">
                    {get(instructor, 'role', '')}
                  </p>
                  <div class="flex gap-1 items-center dark:text-white">
                    <PlayFilled size={16} class="text-primary-700" />
                    <p class="text-xs font-medium mt-0.5">
                      {get(instructor, 'coursesNo', '')}
                      {$t('course.navItem.landing_page.courses')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p class="text-xs font-light text-[#656565] dark:text-white">
              {get(instructor, 'description', '')}
            </p>
          </section>
        </div>
      </div>
    </div>
    {#if !isVisible}
      <PricingSection
        {pathwayData}
        {editMode}
        bind:startCoursePayment
        mobile={true}
        className="w-full"
      />
    {/if}
  </div>
</div>

<style lang="scss">
  * {
    font-family: Inter, sans-serif;
  }

  .banner {
    background-color: #f5f8fe;
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
    background-color: #d9e0f5;
    color: #0233bd;
  }

  nav {
    overflow: auto;
    margin: 0;
    overflow-y: hidden;
    width: 100%;
  }

  .course-list-border:not(:last-child) {
    border-bottom: 1px solid #eaeaea;
  }

  :global(.landingpage-list ul) {
    padding-left: 0;
  }

  :global(.landingpage-list li) {
    display: flex;
    align-items: center;
  }

  :global(.landingpage-list li::before) {
    content: url('/list-checkmark-icon.svg'); /* Your custom bullet */
    display: inline-block;
    margin-right: 1.2rem; /* Adjust this value for spacing */
  }

  :global(.list ul li) {
    margin-left: 1rem;
    list-style-type: disc;
  }

  :global(.plyr) {
    width: 100% !important;
  }

  .read-more-content {
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .expanded {
    max-height: none;
  }
  @media screen and (max-width: 1023px) {
    .course-content {
      min-width: 80%;
    }
  }
</style>
