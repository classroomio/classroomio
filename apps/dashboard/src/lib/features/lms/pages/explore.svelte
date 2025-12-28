<script lang="ts">
  import { onMount } from 'svelte';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { CoursesPage } from '$features/course/pages';
  import { courseMetaDeta } from '$features/course/utils/store';
  import { coursesApi } from '$features/course/api';
  import type { RecommendedCourses } from '$features/course/types';

  let searchValue = $state('');
  let selectedId: string | undefined = $state('');

  const filteredExploreCourses: RecommendedCourses = $derived.by(() => {
    if (selectedId) {
      localStorage.setItem('classroomio_filter_course_key', selectedId);
    }

    const coursesFiltered = coursesApi.recommendedCourses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (selectedId === '0') {
      return coursesFiltered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (selectedId === '1') {
      return coursesFiltered.sort((a, b) => (b.lessonCount ?? 0) - (a.lessonCount ?? 0));
    }

    return coursesFiltered;
  });


  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }

    selectedId = localStorage.getItem('classroomio_filter_course_key') || '0';
  });

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getRecommendedCourses();
  });
</script>

<CoursesPage
  courses={filteredExploreCourses}
  emptyTitle={$t('explore.empty_heading')}
  emptyDescription={$t('explore.empty_description')}
  isExplore={true}
  isLMS={true}
  isLoading={coursesApi.isLoading}
  bind:searchValue
  bind:selectedId
/>
