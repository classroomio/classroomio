<script>
  import CourseCard from './components/CourseCard.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '../Settings/store';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import { get } from 'lodash';

  let viewAll = false;
</script>

{#if $landingPageSettings.courses.show}
  <section class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl">{$landingPageSettings.courses.title}</h1>
    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <section class="flex gap-8 p-4">
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
          <PrimaryButton label="VIEW MORE COURSES" className="rounded-none text-lg" />
        </div>
      {/if}
    {:else}
      <Box>
        <CoursesEmptyIcon />
        <h3 class="dark:text-white text-2xl my-5">
          {$t('course.navItem.landing_page.no_course_published')}
        </h3>
        <p class="dark:text-white w-1/3 text-center">
          {$t('course.navItem.landing_page.coming_your_way')}
        </p>
      </Box>
    {/if}
  </section>
{/if}
