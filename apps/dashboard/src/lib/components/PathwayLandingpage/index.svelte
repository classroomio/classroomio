<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Pathway } from '$lib/utils/types';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import WatsonHealthICa_2D from 'carbon-icons-svelte/lib/WatsonHealthICa_2D.svelte';
  import { get } from 'lodash';
  import { VARIANTS } from '../PrimaryButton/constants';
  import { IbmWatsonKnowledgeCatalog } from 'carbon-icons-svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
  import { onMount } from 'svelte';

  export let editMode = false;
  export let pathwayData: Pathway;

  let isSticky = false;

  const NAV_ITEMS = [
    {
      key: 'about',
      value: 'ABOUT'
    },
    {
      key: 'objectives',
      value: 'OBJECTIVES'
    },

    {
      key: 'course',
      value: 'COURSE'
    },

    {
      key: 'review',
      value: 'REVIEW'
    },
    {
      key: 'instructor',
      value: 'INSTRUCTOR (S)'
    }
  ];

  const objectives = [
    'Develop a comprehensive derstanding of user experience (UX) design principles, methodologies, and best practices.',
    'Acquire hands-on experience in conducting user research, including methods for gathering, analyzing, and interpreting user insights.',
    'Cultivate proficiency in creating wireframes, prototypes, and interactive designs using industry-standard tools and techniques.',
    'Master the art of usability testing and iterative design processes to refine and optimize user interfaces for enhanced usability and user satisfaction.',
    'Prepare for a successful career as a UX specialist by building a strong portfolio of diverse projects showcasing practical application of UX design principles and methodologies.'
  ];
  function handleClose() {
    goto(`/pathways/${pathwayData.id}`);
  }

  console.log('pathway 1', pathwayData);

  onMount(() => {
    const getCourseSection = document.getElementById('get-course-section');
    const certificateSection = document.getElementById('certificate-section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === 'get-course-section') {
            if (entry.isIntersecting) {
              isSticky = true;
            }
          } else if (entry.target.id === 'certificate-section') {
            if (entry.isIntersecting) {
              isSticky = false;
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (getCourseSection) {
      observer.observe(getCourseSection);
    }

    if (certificateSection) {
      observer.observe(certificateSection);
    }

    return () => {
      if (getCourseSection) {
        observer.unobserve(getCourseSection);
      }
      if (certificateSection) {
        observer.unobserve(certificateSection);
      }
    };
  });
</script>

<!-- <CloseButton onClick={handleClose} /> -->
<section class="relative">
  <header id="header" class="max-h-full">
    <div class="bg-[#F5F8FE] flex w-full items-center justify-center gap-4 p-10">
      <div class="space-y-4 w-full py-10">
        <span
          class="flex w-fit gap-2 items-center border bg-gray-200 border-gray-700 rounded-md py-1 px-4"
        >
          <WatsonHealthICa_2D size={20} />
          <p class="uppercase text-sm font-medium">Learning path</p>
        </span>
        <p class="text-5xl font-semibold w-11/12">Become A Professional UX designer</p>
        <p class="text-base font-medium w-10/12">
          Dive deep into user-centric design principles, master industry-standard tools, and unleash
          your creativity. Join us and pave the way for a rewarding career in crafting exceptional
          digital experiences.
        </p>
        <PrimaryButton
          label="Enroll Now"
          variant={VARIANTS.CONTAINED}
          className="!px-10 !py-4  text-sm"
        />
      </div>

      <!-- {#if video}
              <div class="banner-image flex w-full md:w-2/3">
                <div
                  bind:this={player}
                  id="player"
                  data-plyr-provider="youtube"
                  data-plyr-embed-id={getEmbedId(video)}
                />
              </div>
            
            {:else} -->
      <div class="relative w-full overflow-hidden rounded-md md:w-2/3">
        <img
          style="min-width:280px; min-height:200px"
          alt="About us"
          src={'/images/classroomio-course-img-template.jpg'}
          class="relative mt-2 h-full max-h-[400px] w-full max-w-[500px] rounded-md md:mt-0"
        />
      </div>
      <!-- {/if} -->
    </div>
    <div class=" p-6 flex items-center justify-between w-full bg-primary-600">
      <div class="flex items-center gap-4">
        <span class="flex items-center justify-center rounded-full bg-gray-200 p-2">
          <IbmWatsonKnowledgeCatalog />
        </span>
        <div class="text-white space-y-2 w-[70%]">
          <p class="text-3xl font-semibold">6 courses</p>
          <p class="text-sm">Carefully curated courses to achieve your goals</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="flex items-center justify-center rounded-full bg-gray-200 p-2">
          <IbmWatsonKnowledgeCatalog />
        </span>
        <div class="text-white space-y-2 w-[70%]">
          <p class="text-3xl font-semibold">Get Certificate</p>
          <p class="text-sm">Carefully curated courses to achieve your goals</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <span class="flex items-center justify-center rounded-full bg-gray-200 p-2">
          <IbmWatsonKnowledgeCatalog />
        </span>
        <div class="text-white text-3xl font-semibold space-y-2 w-[70%]">
          <div class="flex items-center gap-2">
            <p class="text-3xl font-semibold">4.8</p>
            <img src="/images/rating-5.svg" alt="rating" class="w-32" />
          </div>
          <p class="text-sm">Carefully curated courses to achieve your goals</p>
        </div>
      </div>
    </div>
  </header>
  <nav class="sticky top-0 flex justify-between items-center p-10 bg-white z-10">
    {#each NAV_ITEMS as items}
      <p class="text-lg font-semibold p-2 cursor-pointer {NavClasses.item}">{items.value}</p>
    {/each}
  </nav>

  <div class="relative flex justify-between items-start border border-purple-400 p-10">
    <div class="w-[50%] space-y-16">
      <!-- about section -->
      <div class=" space-y-4">
        <p class="text-3xl font-semibold">Learning Path Description</p>
        <p class="text-base text-justify font-normal">
          Become a Professional UX Specialist course offers a comprehensive pathway to mastery in
          user experience design. In today's digital landscape, exceptional user experiences are
          paramount for success. This course equips you with the skills and knowledge needed to
          create intuitive, engaging, and impactful designs that resonate with users. Gain a
          competitive edge, unlock career opportunities, and make a meaningful impact in shaping the
          future of digital interactions.
        </p>
      </div>
      <!-- objective section -->
      <div class="space-y-4">
        <p class="text-3xl font-semibold">Learn Path Objectives</p>

        {#each objectives as item}
          <div class="flex items-center my-2 gap-2">
            <div>
              <CheckmarkFilled size={20} class=" fill-blue-600" />
            </div>
            <p class="text-base font-normal">{item}</p>
          </div>
        {/each}
      </div>
    </div>
    <!-- card section -->
    <div class="sticky top-20 border border-red-500 h-40 w-40">card section</div>
  </div>
  <!-- certificate section -->

  <div id="certificate-section" class="border border-black-500 h-40 w-[80%]">
    certificate section
  </div>
  <div
    id="get-course-section"
    class:fixed-bottom={isSticky}
    class="border border-blue-500 h-10 w-full"
  >
    get course section using intersectionobserver
  </div>
  <div class="border border-primary-600 h-screen w-full">Courses section</div>
  <div class="border border-primary-600 h-screen w-full">Courses section 2</div>
</section>

<style>
  .fixed-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
  }
</style>
