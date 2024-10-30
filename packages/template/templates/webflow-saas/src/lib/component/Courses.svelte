<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import CardLoader from './CardLoader.svelte';
  import { DirectionStraightRight } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';

  let viewAll = false;
  export let data;

  const { org, courses } = data;
</script>

{#if org.courses.show}
  <section id="course" class="px-2 pt-4 pb-20 h-full md:px-5">
    <h1 class="text-start text-3xl mb-2 font-bold pl-2">
      {org.courses.title}
    </h1>
    <p class="text-start text-[#878787] mb-2 pl-2">{org.courses.subtitle}</p>
    {#if $courseMetaData.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if courses.length > 0}
      <section class="flex flex-wrap items-center gap-4 px-2 py-4 w-full mx-auto">
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
  </section>
{/if}
