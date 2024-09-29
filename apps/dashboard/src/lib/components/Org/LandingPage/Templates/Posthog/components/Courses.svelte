<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Posthog/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { get } from 'lodash';
  import EmptyState from '../../../components/EmptyState.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let viewAll = false;
</script>

{#if $landingPageSettings.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full md:px-20">
    <h1 class="text-center text-5xl mb-8">
      {$landingPageSettings.courses.title}
      <strong class="text-[#EB9D2A]">{$landingPageSettings.courses.titleHighlight}</strong>
    </h1>
    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <CourseCard
            slug={courseData.slug}
            title={courseData.title}
            description={courseData.description}
          />
        {/each}
      </section>
      {#if $courses.length < 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            className="rounded-md capitalize !ring-1 !ring-[#B17816] px-14 dark:!bg-[#EB9D2A] hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-semibold mb-4"
            variant={VARIANTS.NONE}
            label="VIEW MORE COURSES"
            onClick={() => (viewAll = !viewAll)}
          />
        </div>
      {/if}
    {:else}
      <div class="px-10">
        <EmptyState />
      </div>
    {/if}
  </section>
{/if}
