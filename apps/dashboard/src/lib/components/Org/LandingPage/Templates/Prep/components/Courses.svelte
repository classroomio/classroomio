<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Prep/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';

  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';

  import EmptyState from '../../../components/EmptyState.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let viewAll = false;
</script>

{#if $landingPageSettings.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white md:px-20">
    <h1 class="text-center text-3xl font-playfair">{$landingPageSettings.courses.title}</h1>
    <p class="text-center w-[50%] mx-auto font-inter font-medium mb-8">
      {$landingPageSettings.courses.subtitle}
    </p>
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
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            label="VIEW MORE PREPCOURSES"
            variant={VARIANTS.NONE}
            className="rounded-none text-lg !bg-[#0233BD] text-white font-semibold"
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
