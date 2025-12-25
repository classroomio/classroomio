<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { CoursesPage } from '$features/course/pages';
  import { courseMetaDeta } from '$features/course/utils/store';
  import { fetchExploreCourses } from '$lib/utils/services/courses';

  let searchValue = $state('');
  let selectedId: string | undefined = $state('');
  let hasFetched = false;
  let exploreCourseList: Course[] = $state([]);

  const filteredExploreCourses: Course[] = $derived(filterCourses(searchValue, selectedId || '', exploreCourseList));

  function getCourses(userId?: string, orgId?: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }

    untrack(async () => {
      $courseMetaDeta.isLoading = true;

      const coursesResult = await fetchExploreCourses(userId, orgId);

      $courseMetaDeta.isLoading = false;

      if (!coursesResult) return;

      exploreCourseList = coursesResult.allCourses;
      hasFetched = true;
    });
  }

  function filterCourses(searchValue: string, _selectedId: string | null, courses: Course[]) {
    if (_selectedId) {
      localStorage.setItem('classroomio_filter_course_key', _selectedId);
    }

    const coursesFiltered = courses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (_selectedId === '0') {
      return coursesFiltered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (_selectedId === '1') {
      return coursesFiltered.sort((a, b) => (b.total_lessons ?? 0) - (a.total_lessons ?? 0));
    }

    return coursesFiltered;
  }

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }

    selectedId = localStorage.getItem('classroomio_filter_course_key') || '0';
  });

  $effect(() => {
    getCourses($profile.id, $currentOrg.id);
  });
</script>

<CoursesPage
  courses={filteredExploreCourses}
  emptyTitle={$t('explore.empty_heading')}
  emptyDescription={$t('explore.empty_description')}
  isExplore={true}
  isLMS={true}
  bind:searchValue
  bind:selectedId
/>
