<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { CoursesPage } from '$features/course/pages';
  import { courseMetaDeta } from '$features/course/utils/store';
  import { coursesApi } from '$features/course/api';
  import type { RecommendedCourses } from '$features/course/types';
  import { CourseSortBy, DEFAULT_COURSE_SORT, parseCourseSortValue } from '$features/course/utils/constants';
  import CoursePreviewModal from '$features/lms/components/course-preview-modal.svelte';

  let searchValue = $state('');
  let sortKey = $state<CourseSortBy>(DEFAULT_COURSE_SORT);
  let selectedCourse = $state<RecommendedCourses[number] | null>(null);
  let previewOpen = $state(false);

  $effect(() => {
    if (!browser) return;
    void sortKey;
    localStorage.setItem('classroomio_filter_course_key', sortKey);
  });

  const filteredExploreCourses: RecommendedCourses = $derived.by(() => {
    const coursesFiltered = coursesApi.recommendedCourses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())) {
        return true;
      }

      return false;
    });

    if (sortKey === CourseSortBy.DateCreated) {
      return coursesFiltered.sort(
        (a, b) => new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime()
      );
    } else if (sortKey === CourseSortBy.Published) {
      return coursesFiltered.sort((a, b) => Number(b.isPublished) - Number(a.isPublished));
    } else if (sortKey === CourseSortBy.Lessons) {
      return coursesFiltered.sort((a, b) => (b.lessonCount ?? 0) - (a.lessonCount ?? 0));
    }

    return coursesFiltered;
  });

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }

    sortKey = parseCourseSortValue(localStorage.getItem('classroomio_filter_course_key'));
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
  bind:sortKey
  onCardClick={(course) => {
    selectedCourse = course as RecommendedCourses[number];
    previewOpen = true;
  }}
/>

{#if selectedCourse}
  <CoursePreviewModal course={selectedCourse} bind:open={previewOpen} />
{/if}
