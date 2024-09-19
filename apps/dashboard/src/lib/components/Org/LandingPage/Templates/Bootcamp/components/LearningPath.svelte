<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/CourseCard.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import EmptyState from '../../../components/EmptyState.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let viewAll = false;
</script>

{#if $landingPageSettings.pathway?.show}
  <section id="path" class="p-4 lg:p-20 h-full bg-white">
    <div class="text-start mb-4 lg:text-center px-4 md:px-10 py-4">
      <p class="text-2xl md:text-3xl mb-4">{$landingPageSettings.pathway.title}</p>
      <p class=" text-[#878787] text-xs">{$landingPageSettings.pathway.subtitle}</p>
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
          />
        {/each}
      </section>
      {#if $courses.length > 3}
        <div class="w-full flex items-center justify-center my-5">
          <PrimaryButton
            variant={VARIANTS.NONE}
            label="VIEW MORE"
            className="rounded-none text-lg"
            onClick={() => (viewAll = !viewAll)}
          />
        </div>
      {/if}
    {:else}
      <div class="px-10">
        <EmptyState type="pathways" template="bootcamp" />
      </div>
    {/if}
  </section>
{/if}
