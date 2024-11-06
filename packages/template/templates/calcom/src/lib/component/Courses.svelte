<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import CardLoader from './CardLoader.svelte';
  import ArrowRight from 'carbon-icons-svelte/lib/ArrowRight.svelte';
  import ArrowLeft from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import { goto } from '$app/navigation';

  export let data;

  const { org, courses } = data;

  let coursesList = [1, 2, 3, 4, 5, 6, 7];
  let scrollContainer: HTMLDivElement;

  function scrollLeft() {
    scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
  }

  function scrollRight() {
    scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
  }
</script>

{#if org.courses.show}
  <section id="course" class="flex items-center px-2 md:px-8 py-12 h-full bg-[#E5E7E0]">
    <div class="text-white py-8 bg-black rounded-3xl w-full lg:w-[90%] mx-auto">
      <div
        class="flex flex-col md:flex-row items-center justify-center md:items-start gap-2 md:justify-between px-4 lg:px-8"
      >
        <h1
          class="text-white text-start text-2xl md:text-3xl lg:text-5xl mb-2 font-bold w-full md:w-[80%] lg:w-[60%]"
        >
          {org.courses.title}
        </h1>

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
      </div>

      <div class="w-full pl-4 md:pl-8 overflow-x-hidden">
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

            <!-- uncomment this to see try the course carousel -->

            <!-- {#each coursesList as courseData}
              <CourseCard
                slug="Patterns"
                title="Introduction to patterns"
                bannerImage=""
                description="This is an introduction to patterns in UIUX designs, it teaches the fundamental concepts about patterns and other intrinsic details"
              />
            {/each} -->
          </section>
        {:else}
          <div class="w-full mx-auto">
            <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
          </div>
        {/if}
      </div>
      <div class="flex items-center justify-center w-full pt-4">
        <Button
          class="uppercase rounded-2xl py-6 px-10 bg-transparent border-[1.5px] border-white text-white shadow-[-1px_3px_#FFFFFF]"
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
