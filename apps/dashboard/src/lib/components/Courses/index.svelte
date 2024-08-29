<script lang="ts">
  import Box from '$lib/components/Box/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import List from '$lib/components/Courses/components/List/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import type { Course, Pathway } from '$lib/utils/types';
  import { globalStore } from '$lib/utils/store/app';
  import {
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody
  } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { LMSCourse } from '$lib/components/LMS/store';
  import { getPathwayCompletedCoursesLength } from '$lib/utils/functions/pathway';

  export let courses: LMSCourse[] = [];
  export let emptyTitle = $t('courses.course_card.empty_title');
  export let emptyDescription = $t('courses.course_card.empty_description');
  export let isExplore = false;
  export let searching = false;

  function calcProgressRate(progressRate?: number, totalItem?: number): number {
    if (!progressRate || !totalItem) {
      return 0;
    }
    return Math.round((progressRate / totalItem) * 100);
  }

  function calculatePathwayProgress(pathway: Pathway): number {
    if (!pathway.isPathway) return 0;

    const totalCourses = pathway?.total_course;
    if (totalCourses === 0) return 0;

    // Number of courses completed within the pathway
    const completedCourses = getPathwayCompletedCoursesLength(pathway);

    return Math.round((completedCourses / totalCourses) * 100);
  }

  function calculateCourseAndPathwayProgress(course: LMSCourse): number {
    if (course.isPathway) {
      return calculatePathwayProgress(course as Pathway);
    } else {
      // Individual course progress calculation
      return calcProgressRate(course.progress_rate, course.total_lessons);
    }
  }
</script>

<!-- <CopyCourseModal /> -->

<div class={`w-full my-4 mx-auto`}>
  {#if $courseMetaDeta.isLoading}
    <section class={`${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      <CardLoader />
      <CardLoader />
      <CardLoader />
    </section>
  {:else if $courseMetaDeta.view === 'list'}
    <StructuredList selection class="w-full">
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>
            {$t('courses.course_card.list_view.title')}
          </StructuredListCell>
          <StructuredListCell head>
            {$t('courses.course_card.list_view.description')}
          </StructuredListCell>
          {#if !$isMobile}
            <StructuredListCell head>
              {$t('courses.course_card.list_view.type')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.lessons')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.students')}
            </StructuredListCell>
            <StructuredListCell head>
              {$t('courses.course_card.list_view.published')}
            </StructuredListCell>
          {/if}
          <StructuredListCell head>{''}</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each courses as courseData}
          <List
            id={courseData.id}
            title={courseData.title}
            type={$t(`course.navItem.settings.${courseData.type.toLowerCase()}`)}
            description={courseData.description}
            isPublished={courseData.is_published}
            totalLessons={courseData.total_lessons}
            totalStudents={courseData.total_students}
          />
        {/each}
      </StructuredListBody>
    </StructuredList>
  {:else}
    <section class={`${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      {#each courses as courseData}
        {#key courseData.id}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            description={courseData.description}
            isPublished={courseData.is_published}
            cost={courseData.cost}
            type={courseData.type}
            isLearningPath={courseData.isPathway}
            totalCourse={courseData.total_course}
            totalCount={courseData?.total_count}
            pathwaycompletedCourses={getPathwayCompletedCoursesLength(courseData)}
            currency={courseData.currency}
            totalLessons={courseData.total_lessons}
            totalStudents={courseData.total_students}
            isLMS={$globalStore.isOrgSite}
            {isExplore}
            progressRate={calculateCourseAndPathwayProgress(courseData)}
          />
        {/key}
      {/each}
    </section>
  {/if}
</div>
{#if !$courseMetaDeta.isLoading && !courses.length}
  <Box className="w-full">
    <CoursesEmptyIcon />
    {#if searching}
      <h3 class="dark:text-white text-2xl my-5">{$t('search.no_course')}</h3>
    {:else}
      <h3 class="dark:text-white text-2xl my-5">{emptyTitle}</h3>
      <p class="dark:text-white w-1/3 text-center">
        {emptyDescription}
      </p>
    {/if}
  </Box>
{/if}
