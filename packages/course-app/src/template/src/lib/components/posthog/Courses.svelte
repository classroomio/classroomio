<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { courses } from '$lib/utils/stores/course';
  import { homePage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';

  /**
   * Constants
   */
  const content = $derived(getPageSection($homePage, 'courses'));

  let viewAll = $state(false);
</script>

{#if content?.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full md:px-10">
    <h1 class="text-center text-3xl mb-8 font-bold w-full md:w-[90%] lg:w-[70%] mx-auto">
      {content.settings.title}
      <span class="text-[#F54E00] dark:text-[#EB9D2A]">{content.settings.titleHighlight}</span>
    </h1>
    {#if $courses.length > 0}
      <section class="grid place-items-center grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <CourseCard
            slug={courseData.slug}
            title={courseData.title}
            description={courseData.description}
          />
        {/each}
      </section>
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <Button
            on:click={() => (viewAll = !viewAll)}
            class="dark:text-black bg-white text-black capitalize ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
          >
            {viewAll === true ? 'Show less' : 'View more courses'}
          </Button>
        </div>
      {/if}
    {:else}
      <div class="w-full lg:w-[70%] mx-auto">
        <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
      </div>
    {/if}
  </section>
{/if}
