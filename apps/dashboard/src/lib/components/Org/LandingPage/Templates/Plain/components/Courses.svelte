<script>
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';

  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { fade } from 'svelte/transition';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import Box from '$lib/components/Box/index.svelte';
  import { get } from 'lodash';

  let viewAll = false;
</script>

{#if $landingPageSettings.courses.show}
  <section id="courses" transition:fade class="my-10 mx-auto max-w-6xl w-full">
    <div class="w-full">
      <div class="max-w-[500px] mx-auto w-11/12 py-10">
        <h1 class="text-4xl md:text-5xl lg:text-6xl text-center my-4 font-bold">
          {$landingPageSettings.courses.title}
          <span class="text-primary-600">{$landingPageSettings.courses.titleHighlight}</span>
        </h1>
        <p class="text-md text-center">
          {$landingPageSettings.courses.subtitle}
        </p>
      </div>
    </div>
    {#if $courseMetaDeta.isLoading}
      <div class="cards-container my-4 mx-2">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
    {:else if $courses.length > 0}
      <div class="cards-container my-4 mx-2">
        {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            type={courseData.type}
            description={courseData.description}
            isPublished={courseData.is_published}
            cost={courseData.cost}
            currency={courseData.currency}
            totalLessons={get(courseData, 'lessons[0].count', 0)}
            isOnLandingPage={true}
          />
        {/each}
      </div>
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

    {#if $courses.length > 3}
      <div class="w-full mt-3 flex justify-center">
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          onClick={() => (viewAll = !viewAll)}
          label={viewAll
            ? $t('course.navItem.landing_page.view_less')
            : $t('course.navItem.landing_page.view_all')}
          className="px-10 py-5 w-fit"
        />
      </div>
    {/if}
  </section>
{/if}
