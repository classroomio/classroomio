<script>
  import CourseCard from '$lib/components/Org/LandingPage/Templates/Bootcamp/components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import EmptyState from '../../../components/EmptyState.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';

  let viewAll = false;
  let active = 'course';
</script>

{#if $landingPageSettings.courses.show}
  <section id="course" class="p-4 lg:p-20 h-full bg-white">
    <div class="flex flex-col md:flex-row items-center justify-between mb-4">
      <span class="text-start space-y-2 mb-4 lg:mb-0">
        <p class=" text-2xl lg:text-3xl">{$landingPageSettings.courses.title}</p>
        <p class=" text-[#878787] text-xs">{$landingPageSettings.courses.subtitle}</p>
      </span>

      <div class="flex items-center justify-between border border-[#EAEAEA] p-2 bg-[#FCFCFC] w-fit">
        <button
          on:click={() => (active = 'course')}
          class="{active == 'course'
            ? 'bg-[#00E577]'
            : ''}  w-[10rem] text-center text-xl p-2 whitespace-nowrap font-normal"
        >
          Course
        </button>
        <button
          on:click={() => (active = 'path')}
          class="{active == 'path'
            ? 'bg-[#00E577]'
            : ''} w-[10rem] text-xl text-center p-2 whitespace-nowrap font-normal"
        >
          Learning Path
        </button>
      </div>
    </div>
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
            variant={VARIANTS.NONE}
            label="VIEW MORE"
            className="rounded-none text-lg bg-[#00E577]"
            onClick={() => (viewAll = !viewAll)}
          />
        </div>
      {/if}
    {:else}
      <div class="px-10">
        <EmptyState template="bootcamp" />
      </div>
    {/if}
  </section>
{/if}
