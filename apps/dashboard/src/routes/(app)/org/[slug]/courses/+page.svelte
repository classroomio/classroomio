<script lang="ts">
  import { CoursesPage } from '$features/course/pages';
  import { CreateCourseButton, CourseFilterPopover } from '$features/course/components';
  import { courseMetaDeta } from '$features/course/utils/store';
  import {
    CourseSortBy,
    CourseSortOrder,
    DEFAULT_COURSE_SORT,
    DEFAULT_SORT_ORDER,
    parseCourseSortOrder,
    parseCourseSortValue
  } from '$features/course/utils/constants';
  import { browser } from '$app/environment';
  import { SvelteSet } from 'svelte/reactivity';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { coursesApi } from '$features/course/api';

  let { data } = $props();
  const getInitialSelectedTags = () => data.activeTags ?? [];

  let searchValue = $state('');
  let sortKey: CourseSortBy = $state(DEFAULT_COURSE_SORT);
  let selectedOrder = $state<CourseSortOrder>(DEFAULT_SORT_ORDER);

  let selectedTags = $state<string[]>(getInitialSelectedTags());
  let courseType = $state<string>('all');

  const courseTypeOptions = $derived([
    { value: 'SELF_PACED', label: $t('new_course_modal.self_paced_label') },
    { value: 'LIVE_CLASS', label: $t('new_course_modal.live_class_label') },
    { value: 'COMPLIANCE', label: $t('new_course_modal.compliance_label') },
    { value: 'PUBLIC', label: $t('new_course_modal.public_label') }
  ]);

  let hasInitializedFilters = $state(false);
  let hasCompletedInitialUrlSync = false;
  let isFiltering = $state(false);

  $effect(() => {
    if (data.courses) {
      coursesApi.orgCourses = data.courses;
    }
  });

  function updateFiltersUrl() {
    if (!browser || !hasInitializedFilters) {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (selectedTags.length > 0) {
      nextUrl.searchParams.set('tags', selectedTags.join(','));
    } else {
      nextUrl.searchParams.delete('tags');
    }

    if (sortKey !== DEFAULT_COURSE_SORT) {
      nextUrl.searchParams.set('sort', sortKey);
    } else {
      nextUrl.searchParams.delete('sort');
    }

    if (selectedOrder !== DEFAULT_SORT_ORDER) {
      nextUrl.searchParams.set('order', selectedOrder);
    } else {
      nextUrl.searchParams.delete('order');
    }

    if (courseType !== 'all') {
      nextUrl.searchParams.set('type', courseType);
    } else {
      nextUrl.searchParams.delete('type');
    }

    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.replaceState(window.history.state, '', nextPath);
  }

  $effect(() => {
    if (!browser || !hasInitializedFilters) {
      return;
    }

    localStorage.setItem('classroomio_filter_course_sort_key', sortKey);
    localStorage.setItem('classroomio_filter_course_order_key', selectedOrder);

    if (!hasCompletedInitialUrlSync) {
      hasCompletedInitialUrlSync = true;
      return;
    }

    updateFiltersUrl();
  });

  async function applyTagFilters(nextTags: string[]) {
    selectedTags = nextTags;
    updateFiltersUrl();
    isFiltering = true;
    try {
      await coursesApi.getOrgCourses(nextTags);
    } finally {
      isFiltering = false;
    }
  }

  function toggleTag(tagSlug: string, checked: boolean) {
    const next = new SvelteSet(selectedTags);

    if (checked) {
      next.add(tagSlug);
    } else {
      next.delete(tagSlug);
    }

    void applyTagFilters(Array.from(next));
  }

  async function clearFilters() {
    sortKey = DEFAULT_COURSE_SORT;
    selectedOrder = DEFAULT_SORT_ORDER;
    courseType = 'all';

    if (selectedTags.length === 0) {
      updateFiltersUrl();
      return;
    }

    await applyTagFilters([]);
  }

  function setCourseType(nextType: string) {
    courseType = nextType;
    updateFiltersUrl();
  }

  const filteredCourses = $derived.by(() => {
    const filteredCourses = (coursesApi.orgCourses ?? []).filter((course) => {
      const matchesSearch = !searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase());

      if (!matchesSearch) return false;

      if (courseType !== 'all' && course.type !== courseType) return false;

      return true;
    });

    const sortedCourses = [...filteredCourses];

    if (sortKey === CourseSortBy.DateCreated) {
      return sortedCourses.sort((a, b) =>
        selectedOrder === CourseSortOrder.Asc
          ? new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime()
          : new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()
      );
    } else if (sortKey === CourseSortBy.Published) {
      return sortedCourses.sort((a, b) =>
        selectedOrder === CourseSortOrder.Asc
          ? Number(a.isPublished) - Number(b.isPublished)
          : Number(b.isPublished) - Number(a.isPublished)
      );
    } else if (sortKey === CourseSortBy.Lessons) {
      return sortedCourses.sort((a, b) =>
        selectedOrder === CourseSortOrder.Asc ? a.lessonCount - b.lessonCount : b.lessonCount - a.lessonCount
      );
    }

    return sortedCourses;
  });

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }

    const sortFromStorage = parseCourseSortValue(localStorage.getItem('classroomio_filter_course_sort_key'));
    const orderFromStorage = parseCourseSortOrder(localStorage.getItem('classroomio_filter_course_order_key'));

    const searchParams = new URLSearchParams(window.location.search);
    const sortFromUrl = parseCourseSortValue(searchParams.get('sort'));
    const orderFromUrl = parseCourseSortOrder(searchParams.get('order'));

    if (sortFromUrl !== DEFAULT_COURSE_SORT || orderFromUrl !== DEFAULT_SORT_ORDER) {
      sortKey = sortFromUrl;
      selectedOrder = orderFromUrl;
    } else if (sortFromStorage !== DEFAULT_COURSE_SORT || orderFromStorage !== DEFAULT_SORT_ORDER) {
      sortKey = sortFromStorage;
      selectedOrder = orderFromStorage;
    }

    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && courseTypeOptions.some((opt) => opt.value === typeFromUrl)) {
      courseType = typeFromUrl;
    }

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
            {courseTypeOptions}
            {selectedTags}
            tagGroups={data.tagGroups}
            {isFiltering}
            onToggleTag={toggleTag}
            onCourseTypeChange={setCourseType}
            onClearFilters={clearFilters}
          />
        {/snippet}
      </CoursesPage>
    {/snippet}
  </Page.Body>
</Page.Root>
