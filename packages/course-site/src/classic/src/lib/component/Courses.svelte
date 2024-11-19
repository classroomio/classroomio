<script lang="ts">
  import { onMount } from 'svelte';
  import CardLoader from './CardLoader.svelte';
  import { courseMetaData } from './store';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();

  const { org, courses } = data;

  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };
  let viewAll = $state(false);
  let type = DISPLAY_COURSE.ALL;
</script>

{#if org.courses.show}
  <section id="course" class="px-4 py-6 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">{org.courses.title}</h1>
    <div class="w-full md:w-[90%] mx-auto">
      {#if $courseMetaData.isLoading}
        <div class="cards-container my-4 mx-2">
          <CardLoader />
          <CardLoader />
          <CardLoader />
        </div>
      {:else if courses.length > 0}
        <section
          class="grid place-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full"
        >
          {#each courses.slice(0, viewAll ? courses.length : 3) as courseData}
            <CourseCard
              slug={courseData.data.slug}
              bannerImage={courseData.data.logo || '/classroomio-course-img-template.jpg'}
              title={courseData.data.title}
              type={courseData.data.type}
              description={courseData.data.description}
              cost={courseData.data.cost}
              currency={courseData.data.currency}
              totalLessons={courseData.lessons}
            />
          {/each}
        </section>
        {#if courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <Button
              class="text-lg font-semibold text-white !bg-[#CE02CE]"
              on:click={() => (viewAll = !viewAll)}
              >View more programs
            </Button>
          </div>
        {/if}
      {:else}
        <div class="px-4 w-full lg:w-[70%] mx-auto">
          <EmptyState
            headerClassName="text-[#CE02CE]"
            type={type == DISPLAY_COURSE.PATH ? 'pathways' : 'course'}
          />
        </div>
      {/if}
    </div>
  </section>
{/if}
