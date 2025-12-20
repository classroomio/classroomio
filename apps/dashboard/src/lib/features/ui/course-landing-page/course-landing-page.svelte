<script lang="ts">
  import get from 'lodash/get';
  import pluralize from 'pluralize';
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { resolve } from '$app/paths';
  import PlayIcon from '@lucide/svelte/icons/play';

  import { getLectureNo } from '$lib/components/Course/function';
  import { currentOrg } from '$lib/utils/store/org';
  import { NAV_ITEM_KEY, NAV_ITEMS } from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { handleOpenWidget, reviewsModalStore } from './store';
  import { COURSE_VERSION, type Course } from '$lib/utils/types';
  import { course, sortLesson } from '$lib/components/Course/store';
  import { getEmbedId } from '$lib/utils/functions/formatYoutubeVideo';
  import { getExerciseCount, getLessonSections, getTotalLessons, filterNavItems } from './utils';
  import { Button } from '@cio/ui/base/button';

  import { Chip } from '@cio/ui/custom/chip';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Image, PoweredBy, UploadWidget } from '$features/ui';
  import * as Avatar from '@cio/ui/base/avatar';
  import PricingSection from './components/pricing-section.svelte';
  import NavSection from './components/nav-section.svelte';
  import { shortenName } from '$lib/utils/functions/string';
  import SectionsDisplay from './components/sections-display.svelte';
  import HtmlRender from '$lib/components/HTMLRender/HTMLRender.svelte';
  import { observeIntersection } from './components/intersection-observer';

  interface Props {
    editMode?: boolean;
    courseData: Course;
  }

  let { editMode = false, courseData = $bindable() }: Props = $props();

  const reviews = $derived(get(courseData, 'metadata.reviews') || []);
  const video = $derived(get(courseData, 'metadata.videoUrl'));

  const lessons = $derived.by(() => {
    const _lessons = get(courseData, 'lessons', []);
    return sortLesson([..._lessons]);
  });
  const totalRatings = $derived(reviews?.reduce((acc = 0, review) => acc + (review?.rating || 0), 0));
  const averageRating = $derived(totalRatings / reviews?.length);
  const expandDescription = $derived(Array(reviews?.length ?? 0).fill(false));

  const allowNewStudent = $derived(get(courseData, 'metadata.allowNewStudent'));
  const bannerImage = $derived(get(courseData, 'logo'));
  const instructor = $derived(get(courseData, 'metadata.instructor') || {});
  const certificate: Course['metadata']['certificate'] = $derived(
    get(courseData, 'metadata.certificate', {
      templateUrl: '/images/certificate-template.svg'
    })
  );

  const navItems = $derived(filterNavItems(courseData, reviews));
  const navItemKeys = $derived(navItems.map((item) => item.key));

  let player: any = $state();
  let startCoursePayment = $state(false);
  let isVisible = $state(false);
  let observer: { destroy: () => void };

  let activeNav = $state(NAV_ITEMS[0].key);

  const lessonSections = getLessonSections(courseData);
  const totalLessons = getTotalLessons(lessonSections);

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

  $effect(() => {
    initPlyr(player, video);
  });
</script>

{#if !editMode}
  <PoweredBy />
{/if}

<div class="flex w-full flex-col items-center bg-white dark:bg-black">
  <!-- Header Section -->
  <header id="header" class="banner p- flex w-full items-center justify-center">
    <div class="flex w-full flex-col-reverse items-center justify-between md:w-5/6 md:flex-row">
      <!-- Course Description -->
      <div class="w-11/12 py-10 md:w-2/5">
        <h1 class="my-4 text-5xl text-white dark:text-white">
          {get(courseData, 'title', '')}
        </h1>
        <p class="text-md mb-6 text-white dark:text-white">
          {get(courseData, 'description', '')}
        </p>

        <p class="author my-3 text-sm dark:text-white">
          {get(courseData, 'metadata.instructor.name', '')}
        </p>
        <Button
          class="mt-6 hidden sm:w-fit md:block"
          onclick={() => {
            if (editMode) return;
            startCoursePayment = true;
          }}
          disabled={!allowNewStudent}
        >
          {$t('course.navItem.landing_page.start_course')}
        </Button>
        {#if $handleOpenWidget.open}
          <UploadWidget bind:imageURL={$course.logo} />
        {/if}
      </div>

      <!-- Banner Image getEmbedId(videoUrl) -->
      {#if video}
        <div class="banner-image flex w-full md:w-2/3">
          <div bind:this={player} id="player" data-plyr-provider="youtube" data-plyr-embed-id={getEmbedId(video)}></div>
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
        <UnderlineTabs.Root bind:value={activeNav} class="ui:bg-background sticky top-0 py-2">
          <UnderlineTabs.List>
            {#each navItems as navItem (navItem.key)}
              <UnderlineTabs.Trigger value={navItem.key}>
                <a href={resolve(page.url.pathname + navItem.key, {})}>
                  {$t(navItem.label)}
                </a>
              </UnderlineTabs.Trigger>
            {/each}
          </UnderlineTabs.List>
        </UnderlineTabs.Root>

        <!-- Sections - Requirement -->

        {#if navItemKeys.includes(NAV_ITEM_KEY.REQUIREMENT)}
          <NavSection id="requirement">
            <h3 class="mb-3 mt-0 text-2xl">
              {$t('course.navItem.landing_page.requirement')}
            </h3>

            <ul class="list font-light">
              <HtmlRender>{@html get(courseData, 'metadata.requirements', '')}</HtmlRender>
            </ul>
          </NavSection>
        {/if}

        <!-- Sections - Course Description -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.DESCRIPTION)}
          <NavSection id="description">
            <h3 class="mb-3 mt-0 text-2xl">
              {$t('course.navItem.landing_page.description')}
            </h3>

            <HtmlRender className="dark:text-white text-sm font-light">
              {@html get(courseData, 'metadata.description', '')}
            </HtmlRender>
          </NavSection>
        {/if}

        <!-- Sections - Goal -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.GOALS)}
          <NavSection id="goals">
            <h3 class="mb-3 mt-0 text-2xl">{$t('course.navItem.landing_page.learn')}</h3>
            <ul class="list font-light">
              <HtmlRender>{@html get(courseData, 'metadata.goals', '')}</HtmlRender>
            </ul>
          </NavSection>
        {/if}

        <!-- Sections - Certificate -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.CERTIFICATE)}
          <NavSection id="certificate">
            <h3 class="mt-0 text-2xl">{$t('course.navItem.landing_page.certificate')}</h3>
            <p class="mb-3 text-sm font-light dark:text-white">
              {$t('course.navItem.landing_page.certificate_text')}
            </p>

            <Image
              src={certificate?.templateUrl}
              alt="certificate template"
              className="certificate-img max-h-[215px]"
            />
          </NavSection>
        {/if}

        <!-- Sections - Lessons -->
        {#if courseData.version === COURSE_VERSION.V1}
          <NavSection id="lessons">
            <div class="mb-3 flex w-full items-center justify-between">
              <h3 class="mb-3 mt-0 text-2xl">
                {$t('course.navItem.landing_page.content')}
              </h3>
              <p class="text-sm font-light dark:text-white">
                {pluralize('lesson', lessons.length, true)}
              </p>
            </div>

            <div class="flex flex-wrap">
              {#each lessons as lesson, index (lesson.id)}
                <div class="m-2 rounded border px-2 py-1">
                  <Chip value={getLectureNo(index + 1, '0')} />
                  <p class="ml-2 inline text-xs font-light dark:text-white">
                    {lesson.title}
                  </p>
                </div>
              {/each}
            </div>
          </NavSection>
        {:else if courseData.version === COURSE_VERSION.V2}
          <NavSection id="lessons">
            <!-- header -->
            <div class="flex items-center justify-between">
              <h1>{$t('course.navItem.landing_page.course_content')}</h1>
              <span class="text-xs font-normal">
                {pluralize($t('course.navItem.landing_page.modules'), lessonSections.length, true)},
                {pluralize($t('course.navItem.landing_page.lessons'), totalLessons, true)}
              </span>
            </div>

            {#each lessonSections as section (section.id)}
              <SectionsDisplay
                exerciseCount={getExerciseCount(section.lessons)}
                lessonCount={section.lessons?.length}
                lessons={section.lessons}
                title={section.title}
              />
            {/each}
          </NavSection>
        {/if}

        <!-- Sections - Reviews -->
        {#if navItemKeys.includes(NAV_ITEM_KEY.REVIEWS)}
          <NavSection id="reviews">
            <h2 class="my-16 mb-6 ml-0 mr-0 font-semibold">
              {$t('course.navItem.landing_page.reviews')}
            </h2>
            <div class="flex flex-wrap">
              {#each reviews.slice(0, 4) as review, id (review.id)}
                {#if !review.hide}
                  <!-- review -->
                  <div class="item-start my-2 flex w-2/4 flex-row">
                    <!-- image container -->
                    {#if review.avatar_url}
                      <Avatar.Root class="mt-1 size-10">
                        <Avatar.Image
                          src={review.avatar_url ? review.avatar_url : '/logo-192.png'}
                          alt={review.name ? review.name : 'Avatar'}
                        />
                        <Avatar.Fallback>{shortenName(review.name) || 'AV'}</Avatar.Fallback>
                      </Avatar.Root>
                    {/if}

                    <!-- profile content -->
                    <div class="w-11/12 pl-2.5">
                      <p class="mb-0.5 font-medium">{review.name}</p>
                      <!-- ratings -->
                      <div class="flex flex-row items-center">
                        {#if review.rating}
                          <img src="/images/rating-{review.rating}.svg" class="mr-4 mt-1 w-24" alt="" />
                        {/if}
                      </div>
                      <div class="read-more-content mb-2" style="max-height: {expandDescription[id] ? 'none' : '50px'}">
                        <p class="my-2 text-sm leading-5 text-gray-600">
                          {review.description}
                        </p>
                      </div>
                      {#if !expandDescription[id] && review.description.split(' ').length > 9}
                        <button class="ui:text-primary mt-2 font-normal underline" onclick={() => toggleDescription(id)}
                          >See More</button
                        >
                      {/if}
                      {#if expandDescription[id]}
                        <button class="ui:text-primary mt-2 font-normal underline" onclick={() => toggleDescription(id)}
                          >See Less</button
                        >
                      {/if}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
            {#if reviews.length > 4}
              <Button class="mt-2" variant="outline" onclick={() => ($reviewsModalStore.open = true)}>
                {$t('course.navItem.landing_page.see_all')}
              </Button>
            {/if}

            <!-- Reviews Modal -->
            <Dialog.Root bind:open={$reviewsModalStore.open}>
              <Dialog.Content class="w-9/12">
                <Dialog.Header>
                  <Dialog.Title>{$t('course.navItem.landing_page.reviews_modal.title')}</Dialog.Title>
                </Dialog.Header>
                <div class="flex">
                  <!-- ratings -->
                  <div class="w-1/3">
                    <h2 class="text-xl">
                      {averageRating}
                      {$t('course.navItem.landing_page.reviews_modal.rating')}
                    </h2>
                    <h2 class="mt-2 text-lg font-semibold">
                      {reviews.length}
                      {$t('course.navItem.landing_page.reviews_modal.ratings')}
                    </h2>
                  </div>
                  <!-- reviews -->
                  <div class="flex w-4/6 flex-wrap">
                    {#each reviews as review, id (review.id)}
                      <!-- review -->
                      <div class="item-start my-2 flex w-full flex-row">
                        <!-- image container -->
                        {#if review.avatar_url}
                          <Avatar.Root class="mt-1 h-10 w-10">
                            <Avatar.Image
                              src={review.avatar_url ? review.avatar_url : '/logo-192.png'}
                              alt={review.name ? review.name : 'Avatar'}
                            />
                            <Avatar.Fallback>{shortenName(review.name) || 'AV'}</Avatar.Fallback>
                          </Avatar.Root>
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
              </Dialog.Content>
            </Dialog.Root>
          </NavSection>
        {/if}

        <!-- Sections - Instructor -->
        <NavSection id="instructor">
          <h3 class="mb-3 mt-0 text-2xl">
            {$t('course.navItem.landing_page.instructor')}
          </h3>
          <div class="mb-4 flex items-center">
            <img
              alt="Author Avatar"
              class="mr-3 block h-20 w-20 rounded-full"
              src={get(instructor, 'imgUrl', $currentOrg.avatarUrl || '/logo-512.png')}
            />
            <div>
              <p class="text-md font-light dark:text-white">
                {get(instructor, 'name', $currentOrg.name)}
              </p>
              <p class="text-xs font-light dark:text-white">
                {get(instructor, 'role', '')}
              </p>
              <p class="text-md flex items-center font-light dark:text-white">
                <PlayIcon size={16} class="filled" />
                <span class="ml-1"
                  >{get(instructor, 'courseNo', '')}
                  {$t('course.navItem.landing_page.courses')}</span
                >
              </p>
            </div>
          </div>

          <p class="text-sm font-light dark:text-white">
            {get(instructor, 'description', '')}
          </p>
        </NavSection>
      </div>

      <!-- Pricing Details -->
      <PricingSection {courseData} {editMode} bind:startCoursePayment className="target-component" />
    </div>
    {#if !isVisible}
      <PricingSection {courseData} {editMode} bind:startCoursePayment mobile={true} className="w-full" />
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

  :global(.certificate-img) {
    width: unset !important;
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

  .lesson-section:not(:last-child) {
    border-bottom: 1px solid #f7f7f7;
  }

  @media screen and (max-width: 1023px) {
    .course-content {
      min-width: 80%;
    }
  }
</style>
