<script>
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courseMetaData } from './store';
  import CardLoader from './CardLoader.svelte';

  let viewAll = false;
  export let data;

  const { org, courses } = data;
</script>

{#if org.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full md:px-10">
    <h1 class="text-center text-3xl mb-8 font-bold">
      {org.courses.title}
      <span class="text-[#F54E00] dark:text-[#EB9D2A]">{org.courses.titleHighlight}</span>
    </h1>
    {#if $courseMetaData.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if courses.length > 0}
      <section
        class="flex flex-wrap items-center justify-center md:justify-start gap-4 px-2 py-4 w-fit mx-auto"
      >
        {#each courses.slice(0, viewAll ? courses.length : 3) as courseData}
          <CourseCard
            slug={courseData.data.slug}
            title={courseData.data.title}
            description={courseData.data.description}
          />
        {/each}
      </section>
      {#if courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <Button
            on:click={() => (viewAll = !viewAll)}
            class="dark:text-black bg-white text-black capitalize ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
            >{viewAll === true ? 'Show less' : 'View more courses'}</Button
          >
        </div>
      {/if}
    {:else}
      <div class="w-full lg:w-[70%] mx-auto">
        <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
      </div>
    {/if}
  </section>
{/if}
