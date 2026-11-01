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
  import {
    CourseSortBy,
    CourseSortOrder,
    DEFAULT_COURSE_SORT,
    parseCourseSortValue
  } from '$features/course/utils/constants';
  import CoursePreviewModal from '$features/lms/components/course-preview-modal.svelte';
  import * as Pagination from '@cio/ui/base/pagination';

  const EXPLORE_LIMIT = 12;

  const EXPLORE_SORT_ORDER: Record<CourseSortBy, CourseSortOrder> = {
    [CourseSortBy.DateCreated]: CourseSortOrder.Desc,
    [CourseSortBy.LastUpdatedAt]: CourseSortOrder.Desc,
    [CourseSortBy.Published]: CourseSortOrder.Desc,
    [CourseSortBy.Lessons]: CourseSortOrder.Desc,
    [CourseSortBy.Name]: CourseSortOrder.Asc,
    [CourseSortBy.Price]: CourseSortOrder.Asc
  };

  let searchValue = $state('');
  let sortKey = $state<CourseSortBy>(DEFAULT_COURSE_SORT);
  let selectedCourse = $state<RecommendedCourses[number] | null>(null);
  let previewOpen = $state(false);
  let currentPage = $state(1);

  $effect(() => {
    if (!browser) return;
    void sortKey;
    localStorage.setItem('classroomio_filter_course_key', sortKey);
  });

  const filteredExploreCourses: RecommendedCourses = $derived(
    coursesApi.recommendedCourses.filter(
      (course) => !searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase())
    )
  );

  const pagination = $derived(coursesApi.recommendedCoursesPagination);

  function fetchPage(page: number) {
    currentPage = page;
  }

  $effect(() => {
    if (searchValue) {
      currentPage = 1;
    }
  });

  $effect(() => {
    void sortKey;
    currentPage = 1;
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

    coursesApi.getRecommendedCourses({
      limit: EXPLORE_LIMIT,
      page: currentPage,
      sort: sortKey,
      order: EXPLORE_SORT_ORDER[sortKey]
    });
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

{#if pagination && pagination.totalPages > 1}
  <Pagination.Root
    count={pagination.total}
    perPage={pagination.limit}
    page={currentPage}
    onPageChange={fetchPage}
    class="mt-6"
  >
    {#snippet children({ pages, currentPage: activePage })}
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.PrevButton />
        </Pagination.Item>
        {#each pages as pageItem (pageItem.key)}
          {#if pageItem.type === 'ellipsis'}
            <Pagination.Item>
              <Pagination.Ellipsis />
            </Pagination.Item>
          {:else}
            <Pagination.Item>
              <Pagination.Link page={pageItem} isActive={activePage === pageItem.value}>
                {pageItem.value}
              </Pagination.Link>
            </Pagination.Item>
          {/if}
        {/each}
        <Pagination.Item>
          <Pagination.NextButton />
        </Pagination.Item>
      </Pagination.Content>
    {/snippet}
  </Pagination.Root>
{/if}

{#if selectedCourse}
  <CoursePreviewModal course={selectedCourse} bind:open={previewOpen} />
{/if}
