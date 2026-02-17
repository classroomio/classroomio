<script lang="ts">
  import { CoursesPage } from '$features/course/pages';
  import { CreateCourseButton, CourseFilterPopover } from '$features/course/components';
  import { courseMetaDeta } from '$features/course/utils/store';
  import { COURSE_SORT_OPTIONS } from '$features/course/utils/constants';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';
  import { onMount } from 'svelte';
  import * as Page from '@cio/ui/base/page';
  import { coursesApi } from '$features/course/api';

  let { data } = $props();

  let searchValue = $state('');
  let selectedId: string = $state('0');
  let selectedTags = $state<string[]>([]);
  let hasInitializedFilters = $state(false);
  let isFiltering = $state(false);

  const validSortValues = new Set(COURSE_SORT_OPTIONS.map((option) => option.value));

  $effect(() => {
    if (data.courses) {
      coursesApi.orgCourses = data.courses;
    }
  });

  $effect(() => {
    selectedTags = data.activeTags ?? [];
  });

  function normalizeSortValue(sortValue: string | null): string {
    if (sortValue && validSortValues.has(sortValue)) {
      return sortValue;
    }

    return '0';
  }

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

    if (selectedId !== '0') {
      nextUrl.searchParams.set('sort', selectedId);
    } else {
      nextUrl.searchParams.delete('sort');
    }

    const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.replaceState(window.history.state, '', nextPath);
  }

  $effect(() => {
    if (!browser || !hasInitializedFilters) {
      return;
    }

    localStorage.setItem('classroomio_filter_course_key', selectedId);
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
    const next = new Set(selectedTags);

    if (checked) {
      next.add(tagSlug);
    } else {
      next.delete(tagSlug);
    }

    void applyTagFilters(Array.from(next));
  }

  async function clearFilters() {
    selectedId = '0';

    if (selectedTags.length === 0) {
      return;
    }

    await applyTagFilters([]);
  }

  const filteredCourses = $derived.by(() => {
    const filteredCourses = (coursesApi.orgCourses ?? []).filter((course) => {
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

    const sortFromUrl = normalizeSortValue(new URLSearchParams(window.location.search).get('sort'));
    const sortFromStorage = normalizeSortValue(localStorage.getItem('classroomio_filter_course_key'));
    selectedId = sortFromUrl !== '0' ? sortFromUrl : sortFromStorage;
    hasInitializedFilters = true;
    updateFiltersUrl();
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
      <CoursesPage courses={filteredCourses} bind:searchValue bind:selectedId showSortSelect={false}>
        {#snippet filterControls()}
          <CourseFilterPopover
            bind:selectedId
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
