<!-- <script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import CardLoader from './CardLoader.svelte';
  import { DirectionStraightRight } from 'carbon-icons-svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import { goto } from '$app/navigation';

  let viewAll = false;
  export let data;

  const { org, courses } = data;
</script>

{#if org.courses.show}
  <section id="course" class="flex items-center p-8 h-full bg-[#E5E7E0]">
    <div class=" text-white py-8 bg-black rounded-3xl w-[90%] mx-auto">
      <div class="flex items-start justify-between px-8">
        <h1 class="text-white text-start text-3xl mb-2 font-bold w-[40%]">
          {org.courses.title}
        </h1>

        <div class="flex gap-2 items-center">
          <div
            class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white"
          >
            <ArrowRight class="text-white hover:text-black" />
          </div>
          <div
            class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white hover:text-black"
          >
            <ArrowLeft class="text-white hover:text-black" />
          </div>
        </div>
      </div>

      <div class="w-full border border-green-500 pl-8 overflow-x-hidden">
        {#if $courseMetaData.isLoading}
          <div class="cards-container my-4 mx-2">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if courses.length > 0}
          <section
            class="flex items-center overflow-x-scroll gap-4 py-4 w-full border border-red-500"
          >
            {#each courses.slice(0, viewAll ? courses.length : 3) as courseData}
              <CourseCard
                slug={courseData.data.slug}
                title={courseData.data.title}
                bannerImage={courseData.data.banner}
                description={courseData.data.description}
              />
            {/each}
          </section>
          {#if courses.length > 1}
            <div class="w-full flex items-center justify-center my-5 px-2">
              <Button
                on:click={() => {
                  goto('/courses');
                }}
                class="group bg-[#0737BE] hover:bg-[#0737BE] rounded-none text-white gap-6 w-full"
              >
                View all courses
                <DirectionStraightRight
                  class="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Button>
            </div>
          {/if}
        {:else}
          <div class="w-full mx-auto">
            <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
          </div>
        {/if}
      </div>
    </div>
  </section>
{/if} -->

<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import CardLoader from './CardLoader.svelte';
  import { DirectionStraightRight } from 'carbon-icons-svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import { goto } from '$app/navigation';

  export let data;

  const { org, courses } = data;

  let scrollContainer: HTMLDivElement;

  function scrollLeft() {
    scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
  }
</script>

{#if org.courses.show}
  <section id="course" class="flex items-center px-8 py-12 h-full bg-[#E5E7E0]">
    <div class="text-white py-8 bg-black rounded-3xl w-[90%] mx-auto">
      <div class="flex items-start justify-between px-8">
        <h1 class="text-white text-start text-5xl mb-2 font-bold w-[60%]">
          {org.courses.title}
        </h1>
        {#if courses.length > 3}
          <div class="flex gap-2 items-center">
            <button
              class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white"
              on:click={scrollLeft}
            >
              <ArrowLeft class="text-white hover:text-black" />
            </button>
            <button
              class="w-fit flex items-center justify-center border border-white rounded-full p-2 bg-transparent hover:bg-white"
              on:click={scrollRight}
            >
              <ArrowRight class="text-white hover:text-black" />
            </button>
          </div>
        {/if}
      </div>

      <div class="w-full pl-8 overflow-x-hidden">
        {#if $courseMetaData.isLoading}
          <div class="cards-container my-4 mx-2">
            <CardLoader />
            <CardLoader />
            <CardLoader />
          </div>
        {:else if courses.length > 0}
          <section
            bind:this={scrollContainer}
            class="flex items-center overflow-x-auto gap-4 py-4 pr-2 w-full scrollbar-hide"
          >
            {#each courses as courseData}
              <CourseCard
                slug={courseData.data.slug}
                title={courseData.data.title}
                bannerImage={courseData.data.banner}
                description={courseData.data.description}
              />
            {/each}
          </section>
        {:else}
          <div class="w-full mx-auto">
            <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
          </div>
        {/if}
      </div>
      <div class="flex items-center justify-center w-full pt-4">
        <Button
          class="uppercase rounded-2xl py-3 bg-transparent border-[1.5px] border-white text-white shadow-[-1px_3px_#FFFFFF]"
          on:click={() => {
            goto('/courses');
          }}>Explore courses</Button
        >
      </div>
    </div>
  </section>
{/if}

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
