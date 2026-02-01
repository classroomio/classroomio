<script lang="ts">
  import { CoursesPage } from '$features/course/pages';
  import { CreateCourseButton } from '$features/course/components';
  import { courseMetaDeta } from '$features/course/utils/store';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { coursesApi } from '$features/course/api';

  let { data } = $props();

  let searchValue = $state('');
  let selectedId: string = $state('0');

  $effect(() => {
    if (data.courses) {
      coursesApi.orgCourses = data.courses;
    }
  });

  const filteredCourses = $derived.by(() => {
    if (browser) {
      if (!selectedId) {
        selectedId = localStorage.getItem('classroomio_filter_course_key') || '0';
      } else {
        localStorage.setItem('classroomio_filter_course_key', selectedId);
      }
    }

    const filteredCourses = data.courses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (selectedId === '0') {
      return filteredCourses.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (selectedId === '1') {
      return filteredCourses.sort((a, b) => (b.isPublished ? 0 : 1) - (a.isPublished ? 0 : 1));
    } else if (selectedId === '2') {
      return filteredCourses.sort((a, b) => b.lessonCount - a.lessonCount);
    }

    return filteredCourses;
  });

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }
  });
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('courses.heading')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <CreateCourseButton isResponsive />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CoursesPage courses={filteredCourses} bind:searchValue bind:selectedId />
    {/snippet}
  </Page.Body>
</Page.Root>
