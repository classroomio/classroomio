<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Experts/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import EmptyState from '../../../components/EmptyState.svelte';

  let viewAll = false;
</script>

{#if $landingPageSettings.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl">{$landingPageSettings.courses.title}</h1>
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
            className="bg-[#FDFDFD]"
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            description={courseData.description}
            cost={courseData.cost}
            currency={courseData.currency}
          />
        {/each}
      </section>
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            label="VIEW MORE COURSES"
            className="rounded-none text-lg"
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
