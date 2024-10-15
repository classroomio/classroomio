<script>
  import CardLoader from './CardLoader.svelte';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import { Button } from '$lib/components/ui/button';

  export let data;

  const { org, courses } = data;
  let viewAll = false;
</script>

{#if org.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl font-bold mb-4">{org.courses.title}</h1>
    <div class="w-full md:w-[90%] mx-auto">
      {#if $courseMetaData.isLoading}
        <div class="cards-container my-4 mx-2">
          <CardLoader />
          <CardLoader />
          <CardLoader />
        </div>
      {:else if courses.length > 0}
        <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-2">
          {#each courses.slice(0, viewAll ? courses.length : 3) as courseData}
            <CourseCard
              className="bg-[#FDFDFD]"
              slug={courseData.data.slug}
              bannerImage={courseData.data.logo || '/classroomio-course-img-template.jpg'}
              title={courseData.data.title}
              description={courseData.data.description}
              cost={courseData.data.cost}
              currency={courseData.data.currency}
            />
          {/each}
        </section>
        {#if data.courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <Button
              class="rounded-none uppercase bg-blue-900 p-2"
              on:click={() => (viewAll = !viewAll)}>VIEW MORE COURSES</Button
            >
          </div>
        {/if}
      {:else}
        <div class="px-4 w-full lg:w-[70%] mx-auto">
          <EmptyState />
        </div>
      {/if}
    </div>
  </section>
{/if}
