<script lang="ts">
  // import paystack from 'paystack';
  import get from 'lodash/get';
  import { onMount } from 'svelte';
  import pluralize from 'pluralize';
  import { stores } from '@sapper/app';
  import Notebook from 'carbon-icons-svelte/lib/Notebook16/Notebook16.svelte'; //note
  import PresentationFile from 'carbon-icons-svelte/lib/PresentationFile16/PresentationFile16.svelte'; // exercise
  import Video from 'carbon-icons-svelte/lib/Video16/Video16.svelte'; //video
  import PageNumber from 'carbon-icons-svelte/lib/PageNumber16/PageNumber16.svelte';
  import PlayFilled from 'carbon-icons-svelte/lib/PlayFilled16/PlayFilled16.svelte';
  import PrimaryButton from '../PrimaryButton/index.svelte';
  import PricingSection from './components/PricingSection.svelte';
  import { getLectureNo } from '../Course/function';
  import { NAV_ITEMS } from './constants';
  import Chip from '../Chip/index.svelte';
  import { getEmbedId } from '../../utils/functions/formatYoutubeVideo';
  import type { Course, Lesson } from '../../utils/types';

  export let courseData: Course = {
    id: '',
    title: '',
    description: '',
  };
  let lessons: Array<Lesson> = [];
  let player: any;

  const { page } = stores();
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

  onMount(() => {
    window.onhashchange = locationHashChanged;
  });

  $: video = get(courseData, 'metadata.videoUrl');
  $: lessons = get(courseData, 'lessons', []);
  $: instructor = courseData?.metadata?.instructor || {};
  $: initPlyr(player, video);
</script>

<svelte:head>
  <title>{get(courseData, 'title', '')}</title>
</svelte:head>

<div class="w-full bg-white flex flex-col items-center">
  <!-- Header Section -->
  <header class="banner w-full flex items-center justify-center p-">
    <div
      class="md:w-5/6 w-full flex items-center justify-between flex-col-reverse md:flex-row"
    >
      <!-- Course Description -->
      <div class="md:w-2/5 w-11/12 py-10">
        <h1 class="text-5xl text-white my-4 font-bold">
          {get(courseData, 'title', '')}
        </h1>
        <p class="text-md text-white mb-6">
          {get(courseData, 'description', '')}
        </p>

        <p class="author my-3 text-sm">
          {get(courseData, 'metadata.instructor.name', '')}
        </p>
        <PrimaryButton
          label="Start Course"
          className="px-6 py-5 mt-6 sm:w-fit"
        />
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
  <div class="bg-white w-full">
    <div class="py-8 lg:w-10/12 w-full m-2 lg:m-auto flex justify-between">
      <!-- Course Details -->
      <div class="course-content w-full p-3 md:w-9/12 md:mr-14">
        <!-- Navigation -->
        <nav class="flex items-center border-b border-gray-300 pb-3">
          {#each NAV_ITEMS as navItem}
            <a
              href="{$page.path}{navItem.key}"
              class="{navItem.key === activeNav &&
                'active text-blue-700'} rounded-lg px-2 mr-6 text-slate-700 font-normal hover:bg-slate-100 hover:text-slate-900"
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
          <p class="text-sm font-light">
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
          <p class="text-sm font-light mb-3">
            When you complete all of the courses in the program, you'll earn a
            Certificate to share with your professional network.
          </p>
          <img
            src="/images/certificate-template.svg"
            alt="certificate template"
          />
        </section>

        <!-- Sections - Lessons -->
        <section id="lessons" class="border-b border-gray-300 mt-8 pb-10">
          <div class="flex items-center justify-between w-full mb-3">
            <h3 class="text-2xl font-bold mt-0 mb-3">Course Content</h3>
            <p class="text-sm font-light">
              <!-- {lessons.length} lessons -->
              {pluralize('lesson', lessons.length, true)}
            </p>
          </div>
          {#each lessons as lesson, index}
            <div
              class="w-full flex md:items-center justify-between mb-6 flex-col md:flex-row"
            >
              <div class="flex items-center mb-3">
                <Chip
                  value={getLectureNo(index + 1, '0')}
                  className="bg-blue-100 text-blue-700"
                />
                <p class="ml-2 text-sm font-light">{lesson.title}</p>
              </div>

              <div class="w-2/4">
                <div class="flex items-center">
                  {#if lesson.slide_url}
                    <span class="text-sm font-light flex w-2/4"
                      ><PresentationFile class="mr-1" />1 slide</span
                    >
                  {/if}
                  {#if lesson.note}
                    <span class="text-sm font-light flex w-2/4"
                      ><Notebook class="mr-1" />1 note</span
                    >
                  {/if}
                </div>
                <div class="flex items-center">
                  {#if lesson.video_url}
                    <span class="text-sm font-light flex w-2/4"
                      ><Video class="mr-1" />1 video</span
                    >
                  {/if}
                  {#if get(lesson, 'totalExercises[0].count')}
                    <span class="text-sm font-light flex w-2/4"
                      ><PageNumber class="mr-1" />{pluralize(
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
              <p class="text-md font-light">{get(instructor, 'name', '')}</p>
              <p class="text-xs font-light">{get(instructor, 'role', '')}</p>
              <p class="text-md font-light flex items-center">
                <PlayFilled class="text-blue-700" />
                <span class="ml-1"
                  >{get(instructor, 'courseNo', '')} courses</span
                >
              </p>
            </div>
          </div>

          <p class="text-sm font-light">
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
</style>
