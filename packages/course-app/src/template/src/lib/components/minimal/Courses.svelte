<script lang="ts">
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import { courses } from '@/utils/stores/course';
  import PrimaryButton from './PrimaryButton.svelte';

  const content = $derived(getPageSection($homePage, 'about'));
  let viewAll = $state(false);
</script>

{#if content?.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl font-bold mb-4">{content.settings.title}</h1>
    <div class="w-full md:w-[90%] mx-auto">
      {#if $courses.length > 0}
        <section
          class="grid place-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
        >
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              className="bg-[#FDFDFD]"
              slug={courseData.slug}
              title={courseData.title}
              description={courseData.description}
              cost={courseData.cost}
              lessons={courseData.lessonsCount}
              currency={courseData.currency}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <PrimaryButton
              class="rounded-none uppercase bg-blue-900 p-2"
              onClick={() => (viewAll = !viewAll)}
              label="VIEW MORE COURSES"
            />
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
