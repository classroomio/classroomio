<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Experts/components/CourseCard.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import EmptyState from '$lib/components/Org/LandingPage/components/EmptyState.svelte';

  let viewAll = false;
</script>

{#if $landingPageSettings.pathway?.show}
  <section id="path" class="relative p-4 h-full">
    <div class="relative w-full md:w-[80%] rounded-lg overflow-hidden -top-20 md:left-[10%]">
      <img
        src="/images/classroomio-course-img-template.jpg"
        alt=""
        class="w-full h-60 object-cover"
      />
    </div>
    <div class="px-4 md:px-10 py-4">
      <h1 class=" text-3xl text-white">{$landingPageSettings.pathway.title}</h1>
      <p class="text-white w-full md:w-[60%] text-sm">
        {$landingPageSettings.pathway.subtitle}
      </p>
    </div>
    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
        {#each $courses as courseData}
          <CourseCard
            isLearningPath={true}
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            description={courseData.description}
            cost={courseData.cost}
            currency={courseData.currency}
            className="bg-[#192533] text-white border-none"
            buttonClass="border-[#2E3B4D]"
          />
        {/each}
      </section>
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            label="VIEW MORE PATH PROGRAMS"
            className="rounded-none text-lg"
            onClick={() => (viewAll = !viewAll)}
          />
        </div>
      {/if}
    {:else}
      <div class="px-10">
        <EmptyState
          type="pathways"
          headerClassName="text-white"
          subtitleClassName="text-white"
          className="bg-[#192533] border-[#233A5A]"
        />
      </div>
    {/if}
  </section>
{/if}
