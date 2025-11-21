<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import ListIcon from '@lucide/svelte/icons/list';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import SearchIcon from '@lucide/svelte/icons/search';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import Courses from '$lib/components/Courses/index.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import { fetchExploreCourses } from '$lib/utils/services/courses';

  import { IconButton } from '$lib/components/IconButton';

  let searchValue = $state('');
  let selectedId: string | undefined = $state();
  let hasFetched = false;
  let exploreCourseList: Course[] = $state([]);

  const filterOptions = $derived([
    { value: '0', label: $t('courses.course_filter.date_created') },
    { value: '1', label: $t('courses.course_filter.lessons') }
  ]);

  const selectedLabel = $derived(
    filterOptions.find((opt) => opt.value === selectedId)?.label || filterOptions[0].label
  );

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
    <h1 class="text-3xl dark:text-white">{$t('explore.heading')}</h1>
    <div class="flex flex-row-reverse">
      <div class="filter-container flex items-end justify-start gap-2">
        <div class="relative">
          <SearchIcon class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input type="text" placeholder={$t('courses.search_placeholder')} bind:value={searchValue} class="pl-9" />
        </div>
        <Select.Root type="single" bind:value={selectedId}>
          <Select.Trigger class="min-w-[150px]">
            <p>{selectedLabel}</p>
          </Select.Trigger>
          <Select.Content>
            {#each filterOptions as option}
              <Select.Item value={option.value}>{option.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>

        {#if $courseMetaDeta.view === 'list'}
          <IconButton onClick={() => setViewPreference('grid')}>
            <GridIcon size={16} />
          </IconButton>
        {:else}
          <IconButton onClick={() => setViewPreference('list')}>
            <ListIcon size={16} />
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
