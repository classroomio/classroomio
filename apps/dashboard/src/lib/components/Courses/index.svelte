<script lang="ts">
  import Box from '../Box/index.svelte';
  import Card from './components/Card/index.svelte';
  import CardLoader from './components/Card/Loader.svelte';
  import CoursesEmptyIcon from '../Icons/CoursesEmptyIcon.svelte';
  import { courseMetaDeta } from './store';
  import type { Course } from '$lib/utils/types';
  import { globalStore } from '$lib/utils/store/app';
  import { t } from '$lib/utils/functions/translations';

  export let courses: Course[] = [];
  export let emptyTitle = $t('courses.lesson_card.empty_title');
  export let emptyDescription = $t('courses.lesson_card.empty_description');

  function calcProgressRate(progressRate?: number, totalLessons?: number): number {
    if (!progressRate || !totalLessons) {
      return 0;
    }

    return Math.round((progressRate / totalLessons) * 100);
  }
</script>

<!-- <CopyCourseModal /> -->

<div class={`w-full ${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} my-4 mx-auto`}>
  {#if $courseMetaDeta.isLoading}
    <CardLoader />
    <CardLoader />
    <CardLoader />
  {:else}
    {#each courses as courseData}
      {#key courseData.id}
        <Card
          showContextMenu
          id={courseData.id}
          bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
          title={courseData.title}
          description={courseData.description}
          isPublished={courseData.is_published}
          cost={courseData.cost}
          currency={courseData.currency}
          totalLessons={courseData.total_lessons}
          totalStudents={courseData.total_students}
          isLMS={$globalStore.isOrgSite}
          progressRate={calcProgressRate(courseData.progress_rate, courseData.total_lessons)}
        />
      {/key}
    {/each}
  {/if}
</div>
{#if !$courseMetaDeta.isLoading && !courses.length}
  <Box className="w-full">
    <CoursesEmptyIcon />
    <h3 class="dark:text-white text-2xl my-5">{emptyTitle}</h3>
    <p class="dark:text-white w-1/3 text-center">
      {emptyDescription}
    </p>
  </Box>
{/if}
