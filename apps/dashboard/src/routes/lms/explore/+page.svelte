<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Search, Dropdown } from 'carbon-components-svelte';
  import { profile } from '$lib/utils/store/user';
  import { fetchExploreCourses } from '$lib/utils/services/courses';
  import Courses from '$lib/components/Courses/index.svelte';

  import { courseMetaDeta } from '$lib/components/Courses/store';
  import { currentOrg } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { t } from '$lib/utils/functions/translations';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';

  let searchValue = $state('');
  let selectedId: string | undefined = $state();
  let hasFetched = false;
  let exploreCourseList: Course[] = $state([]);

  const filteredExploreCourses: Course[] = $derived(filterCourses(searchValue, selectedId || '', exploreCourseList));

  function getCourses(userId?: string, orgId?: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }

    // don't rerun this function if any state is updated in this function.
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

  const setViewPreference = (preference: 'grid' | 'list') => {
    $courseMetaDeta.view = preference;
    localStorage.setItem('courseView', preference);
  };

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

<section class="w-full md:mx-auto md:max-w-6xl">
  <div class="px-2 py-2 md:px-5 md:py-10">
    <h1 class="text-3xl font-bold dark:text-white">{$t('explore.heading')}</h1>
    <div class="flex flex-row-reverse">
      <div class="filter-container flex items-end justify-start">
        <Search
          placeholder={$t('courses.search_placeholder')}
          bind:value={searchValue}
          searchClass="mr-2"
          class=" bg-gray-100 dark:bg-neutral-800"
        />
        <Dropdown
          class="h-full"
          size="xl"
          bind:selectedId
          items={[
            { id: '0', text: $t('courses.course_filter.date_created') },
            { id: '1', text: $t('courses.course_filter.lessons') }
          ]}
        />

        {#if $courseMetaDeta.view === 'list'}
          <IconButton onClick={() => setViewPreference('grid')}>
            <Grid size={24} />
          </IconButton>
        {:else}
          <IconButton onClick={() => setViewPreference('list')}>
            <List size={24} />
          </IconButton>
        {/if}
      </div>
    </div>
    <Courses
      courses={filteredExploreCourses}
      emptyTitle={$t('explore.empty_heading')}
      emptyDescription={$t('explore.empty_description')}
      isExplore={true}
    />
  </div>
</section>
