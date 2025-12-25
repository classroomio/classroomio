<script lang="ts">
  import { CoursesPage } from '$features/course/pages';
  import { CreateCourseButton } from '$features/course/components';
  import { courses, courseMetaDeta } from '$features/course/utils/store';
  import type { Course } from '$lib/utils/types';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';

  let { data } = $props();

  let searchValue = $state('');
  let selectedId: string = $state('0');

  // Initialize courses store from server data
  $effect(() => {
    if (data.courses) {
      courses.set(data.courses);
    }
  });

  const filteredCourses: Course[] = $derived(filterCourses(searchValue, selectedId, $courses));

  function filterCourses(searchValue: string, _selectedId: string, courses: Course[]) {
    if (browser) {
      if (!selectedId) {
        selectedId = localStorage.getItem('classroomio_filter_course_key') || '0';
      } else {
        localStorage.setItem('classroomio_filter_course_key', _selectedId);
      }
    }

    const filteredCourses = courses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (_selectedId === '0') {
      return filteredCourses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (_selectedId === '1') {
      return filteredCourses.sort((a, b) => (b.is_published ? 0 : 1) - (a.is_published ? 0 : 1));
    } else if (_selectedId === '2') {
      return filteredCourses.sort((a, b) => (b.total_lessons ?? 0) - (a.total_lessons ?? 0));
    }

    return filteredCourses;
  }

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
