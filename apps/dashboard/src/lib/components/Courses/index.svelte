<script lang="ts">
  import Box from '$lib/components/Box/index.svelte';
  import Card from '$lib/components/Courses/components/Card/index.svelte';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import List from '$lib/components/Courses/components/List/index.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import { getPathwayCompletedCoursesLength } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
  import { globalStore } from '$lib/utils/store/app';
  import { isMobile } from '$lib/utils/store/useMobile';
  import type { Course, LMSCourse } from '$lib/utils/types';
  import {
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow
  } from 'carbon-components-svelte';

  export let courses: Course[] = [];
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

  function calculatePathwayProgress(course: LMSCourse): number {
    const totalCourses = course?.total_course;
    if (totalCourses === 0) return 0;

    // Number of courses completed within the pathway
    const completedCourses = getPathwayCompletedCoursesLength(course);

    return totalCourses ? Math.round((completedCourses / totalCourses) * 100) : 0;
  }

  function calculateCourseAndPathwayProgress(course: LMSCourse): number {
    if (course.isPathway) {
      return calculatePathwayProgress(course);
    } else {
      // Individual course progress calculation
      return calcProgressRate(course.progress_rate, course.total_lessons);
    }
  }
</script>

<!-- <CopyCourseModal /> -->

<div class="mx-auto my-4 w-full">
  {#if $courseMetaDeta.isLoading}
    <section class={`${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      <CardLoader />
      <CardLoader />
      <CardLoader />
    </section>
  {:else if $courseMetaDeta.view === 'list' && courses.length}
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
            {#if !$globalStore.isOrgSite}
              <StructuredListCell head>
                {$t('courses.course_card.list_view.lessons')}
              </StructuredListCell>
            {/if}
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
            type={$t(`course.navItem.settings.${courseData?.type?.toLowerCase()}`)}
            description={courseData.description}
            isPublished={courseData.is_published}
            totalLessons={courseData.total_lessons}
            totalStudents={courseData.total_students}
            isLearningPath={courseData.isPathway}
            isLMS={$globalStore.isOrgSite}
            slug={courseData.slug}
            {isExplore}
          />
        {/each}
      </StructuredListBody>
    </StructuredList>
  {:else}
    <section class={`relative ${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
      {#each courses as courseData}
        {#key courseData.id}
          <Card
            id={courseData.id}
            slug={courseData.slug}
            bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
            title={courseData.title}
            description={courseData.description}
            isPublished={courseData.is_published}
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
            tags={courseData.tags}
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
      <h3 class="my-5 text-2xl dark:text-white">{$t('search.no_course')}</h3>
    {:else}
      <h3 class="my-5 text-2xl dark:text-white">{emptyTitle}</h3>
      <p class="w-1/3 text-center dark:text-white">
        {emptyDescription}
      </p>
    {/if}
  </Box>
{/if}
