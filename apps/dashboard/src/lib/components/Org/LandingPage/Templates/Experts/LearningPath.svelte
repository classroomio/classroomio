<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CourseCard from '$lib/components/Org/LandingPage/components/CourseCard.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
</script>

{#if $landingPageSettings.courses.show}
  <section class="relative p-4 h-full">
    <div class="relative w-full md:w-[80%] rounded-lg overflow-hidden -top-20 md:left-[10%]">
      <img
        src="/images/classroomio-course-img-template.jpg"
        alt=""
        class="w-full h-60 object-cover"
      />
    </div>
    <div class="px-4 md:px-10 py-4">
      <h1 class=" text-3xl text-white">Become an expert with my “Learning Path” Programs</h1>
      <p class="text-white w-full md:w-[60%] text-sm">
        With over 5 years of extensive coding experience, I am very much equipped to help you
        achieve success in your choice of coding career.
      </p>
    </div>
    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <section class="flex flex-wrap gap-4 p-4">
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
          <PrimaryButton label="VIEW MORE PATH PROGRAMS" className="rounded-none text-lg" />
        </div>
      {/if}
    {:else}
      <Box>
        <CoursesEmptyIcon />
        <h3 class="text-white text-2xl my-5">
          {$t('course.navItem.landing_page.no_course_published')}
        </h3>
        <p class="text-white w-1/3 text-center">
          {$t('course.navItem.landing_page.coming_your_way')}
        </p>
      </Box>
    {/if}
  </section>
{/if}
