<script lang="ts">
  import Box from '../Box/index.svelte';
  import Card from './components/Card/index.svelte';
  import List from './components/List/index.svelte';
  import CardLoader from './components/Card/Loader.svelte';
  import CoursesEmptyIcon from '../Icons/CoursesEmptyIcon.svelte';
  import { courseMetaDeta, view } from './store';
  import type { Course } from '$lib/utils/types';
  import { globalStore } from '$lib/utils/store/app';
  import {
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody
  } from 'carbon-components-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';

  export let courses: Course[] = [];
  export let emptyTitle = 'No Courses Created';

  export let emptyDescription =
    'Share your knowledge with the world by creating engaging courses for your students.';

  function calcProgressRate(progressRate?: number, totalLessons?: number): number {
    if (!progressRate || !totalLessons) {
      return 0;
    }

    return Math.round((progressRate / totalLessons) * 100);
  }

  //TODO put them in the utility file
  function handleCloneCourse() {
    // TODO: Clone course functionality
    alert('WIP: Clone course');
  }

  function handleShareCourse() {
    // TODO: Share course functionality
    alert('WIP: Share course');
  }

  function handleInvite() {
    // TODO: Invite functionality
    alert('WIP: Invite people to course');
  }

  function handleDeleteCourse() {
    // TODO: Delete course functionality
    alert('WIP: Delete course');
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
  {:else if $view === 'list'}
    <StructuredList selection class="w-full">
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Title</StructuredListCell>
          <StructuredListCell head>Description</StructuredListCell>
          {#if !$isMobile}
            <StructuredListCell head>Lessons</StructuredListCell>
            <StructuredListCell head>Students</StructuredListCell>
            <StructuredListCell head>Published</StructuredListCell>
          {/if}
          <StructuredListCell head>{''}</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each courses as courseData}
          <List
            showContextMenu
            id={courseData.id}
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
        {/each}
      </StructuredListBody>
    </StructuredList>
  {:else}
    <section class={`${$courseMetaDeta.isLoading || courses ? 'cards-container' : ''} `}>
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
    </section>
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
