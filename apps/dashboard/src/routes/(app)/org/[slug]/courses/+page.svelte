<script lang="ts">
  import CoursesPage from '$features/course/pages/courses.svelte';
  import CreateCourseButton from '$features/course/components/create-course-button.svelte';
  import CourseFilterPopover from '$features/course/components/course-filter-popover.svelte';
  import { courseMetaDeta } from '$features/course/utils/store';
  import {
    DEFAULT_COURSE_SORT,
    DEFAULT_SORT_ORDER,
    parseCourseSortOrder,
    parseCourseSortValue,
    type CourseSortBy,
    type CourseSortOrder
  } from '$features/course/utils/constants';
  import {
    DEFAULT_COURSE_LIST_FILTERS,
    filterAndSortOrgCourses,
    mergeCourseListSearchParams,
    parseCourseListFilters,
    type CourseListFilters,
    type PublishedStatusFilter
  } from '$features/course/utils/course-list-filters';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { SvelteSet } from 'svelte/reactivity';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { coursesApi } from '$features/course/api/courses.svelte';

  let { data } = $props();

  let searchValue = $state('');
  let sortKey: CourseSortBy = $state(DEFAULT_COURSE_SORT);
  let selectedOrder = $state<CourseSortOrder>(DEFAULT_SORT_ORDER);
  let selectedTags = $state<string[]>(data.activeTags ?? []);
  let courseType = $state<string>('all');
  let publishedStatus = $state<PublishedStatusFilter>('all');

  const courseTypeOptions = $derived([
    { value: 'SELF_PACED', label: $t('new_course_modal.self_paced_label') },
    { value: 'LIVE_CLASS', label: $t('new_course_modal.live_class_label') },
    { value: 'COMPLIANCE', label: $t('new_course_modal.compliance_label') },
    { value: 'PUBLIC', label: $t('new_course_modal.public_label') }
  ]);

  let hasInitializedFilters = $state(false);
  let isFiltering = $state(false);
  let appliedUrlSearch = $state('');

  const filtersFromUrl = $derived(parseCourseListFilters(page.url.searchParams));

  $effect(() => {
    if (data.courses) {
      coursesApi.orgCourses = data.courses;
    }
  });

  function applyFiltersToState(filters: CourseListFilters) {
    searchValue = filters.search;
    sortKey = filters.sortKey;
    selectedOrder = filters.order;
    selectedTags = filters.tags;
    courseType = filters.courseType;
    publishedStatus = filters.publishedStatus;
  }

  async function navigateCourseFilters(
    nextFilters: CourseListFilters,
    options: { invalidateAll?: boolean; replaceState?: boolean } = {}
  ) {
    const nextParams = mergeCourseListSearchParams(page.url.searchParams, nextFilters);
    const nextSearch = nextParams.toString();
    const currentSearch = page.url.searchParams.toString();

    if (nextSearch === currentSearch) {
      return;
    }

    if (browser) {
      localStorage.setItem('classroomio_filter_course_sort_key', nextFilters.sortKey);
      localStorage.setItem('classroomio_filter_course_order_key', nextFilters.order);
    }

    isFiltering = options.invalidateAll ?? false;
    const targetUrl = `${page.url.pathname}${nextSearch ? `?${nextSearch}` : ''}${page.url.hash}`;

    try {
      await goto(targetUrl, {
        replaceState: options.replaceState ?? false,
        keepFocus: true,
        noScroll: true,
        invalidateAll: options.invalidateAll ?? false
      });
    } catch (error) {
      console.error('navigateCourseFilters error:', error);
    } finally {
      isFiltering = false;
    }
  }

  $effect(() => {
    if (!hasInitializedFilters) {
      return;
    }

    const currentUrlSearch = page.url.searchParams.toString();

    if (currentUrlSearch === appliedUrlSearch) {
      return;
    }

    appliedUrlSearch = currentUrlSearch;
    applyFiltersToState(parseCourseListFilters(page.url.searchParams));
  });

  $effect(() => {
    if (!hasInitializedFilters) {
      return;
    }

    const urlFilters = filtersFromUrl;
    const pendingSearch = searchValue.trim();

    const tagsChanged = selectedTags.join(',') !== urlFilters.tags.join(',');
    const sortChanged = sortKey !== urlFilters.sortKey || selectedOrder !== urlFilters.order;
    const typeChanged = courseType !== urlFilters.courseType;
    const statusChanged = publishedStatus !== urlFilters.publishedStatus;

    if (!tagsChanged && !sortChanged && !typeChanged && !statusChanged) {
      return;
    }

    const nextSearch = pendingSearch !== urlFilters.search ? pendingSearch : urlFilters.search;

    void navigateCourseFilters(
      {
        search: nextSearch,
        tags: selectedTags,
        sortKey,
        order: selectedOrder,
        courseType,
        publishedStatus
      },
      { invalidateAll: tagsChanged }
    );
  });

  $effect(() => {
    if (!hasInitializedFilters) {
      return;
    }

    const normalizedSearch = searchValue.trim();
    const currentSearch = filtersFromUrl.search;

    if (normalizedSearch === currentSearch) {
      return;
    }

    const timeoutId = setTimeout(() => {
      void navigateCourseFilters(
        {
          ...filtersFromUrl,
          search: normalizedSearch
        },
        { replaceState: true }
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  });

  function toggleTag(tagSlug: string, checked: boolean) {
    const next = new SvelteSet(selectedTags);

    if (checked) {
      next.add(tagSlug);
    } else {
      next.delete(tagSlug);
    }

    selectedTags = Array.from(next);
  }

  async function clearFilters() {
    await navigateCourseFilters(DEFAULT_COURSE_LIST_FILTERS, {
      invalidateAll: selectedTags.length > 0
    });
  }

  const filteredCourses = $derived(filterAndSortOrgCourses(coursesApi.orgCourses ?? [], filtersFromUrl));

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }

    const initialParams = new URLSearchParams(window.location.search);
    const initialFilters = parseCourseListFilters(initialParams);
    const hasSortInUrl = initialParams.has('sort') || initialParams.has('order');

    if (!hasSortInUrl) {
      initialFilters.sortKey = parseCourseSortValue(localStorage.getItem('classroomio_filter_course_sort_key'));
      initialFilters.order = parseCourseSortOrder(localStorage.getItem('classroomio_filter_course_order_key'));
    }

    applyFiltersToState(initialFilters);
    appliedUrlSearch = initialParams.toString();
    hasInitializedFilters = true;
  });
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('courses.heading')}</Page.Title>
      <Page.Subtitle>{$t('courses.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <CreateCourseButton isResponsive />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CoursesPage courses={filteredCourses} bind:searchValue bind:sortKey showSortSelect={false}>
        {#snippet filterControls()}
          <CourseFilterPopover
            bind:sortKey
            bind:selectedOrder
            bind:courseType
            bind:publishedStatus
            {courseTypeOptions}
            {selectedTags}
            tagGroups={data.tagGroups}
            {isFiltering}
            onToggleTag={toggleTag}
            onClearFilters={clearFilters}
          />
        {/snippet}
      </CoursesPage>
    {/snippet}
  </Page.Body>
</Page.Root>
