<script lang="ts">
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import SearchIcon from '@lucide/svelte/icons/search';

  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/utils/services/courses';
  import Courses from '$lib/components/Courses/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { IconButton } from '$lib/components/IconButton';
  import GridIcon from '@lucide/svelte/icons/grid-2x2';
  import ListIcon from '@lucide/svelte/icons/list';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let { data } = $props();

  let { cantFetch } = data;
  let searchValue = $state('');
  let selectedId: string = $state('0');
  let hasFetched = false;

  const filterOptions = $derived([
    { value: '0', label: $t('courses.course_filter.date_created') },
    { value: '1', label: $t('courses.course_filter.published') },
    { value: '2', label: $t('courses.course_filter.lessons') }
  ]);

  const selectedLabel = $derived(
    filterOptions.find((opt) => opt.value === selectedId)?.label || filterOptions[0].label
  );

  const filteredCourses: Course[] = $derived(filterCourses(searchValue, selectedId, $courses));

  async function getCourses(userId: string | undefined, orgId: string) {
    if (cantFetch && typeof cantFetch === 'boolean' && orgId && !hasFetched) {
      // only show is loading when fetching for the first time
      if (!$courses.length) {
        $courseMetaDeta.isLoading = true;
      }

      const coursesResult = await fetchCourses(userId, orgId);
      console.log(`coursesResult`, coursesResult);

      $courseMetaDeta.isLoading = false;
      if (!coursesResult) return;

      // organizationId = coursesResult.organizationId;
      courses.set(coursesResult.allCourses);
      hasFetched = true;
    }
  }

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

  const setViewPreference = (preference: 'grid' | 'list') => {
    $courseMetaDeta.view = preference;
    localStorage.setItem('courseView', preference);
  };

  const openNewCourseModal = () => {
    goto($currentOrgPath + '/courses?create=true');
  };

  onMount(() => {
    const courseView = localStorage.getItem('courseView') as 'grid' | 'list' | null;

    if (courseView) {
      $courseMetaDeta.view = courseView;
    }
  });

  $effect(() => {
    getCourses($profile.id, $currentOrg.id);
  });
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<<<<<<< HEAD
<section class="w-full md:mx-auto md:max-w-6xl">
  <div class="px-2 py-2 md:px-5 md:py-10">
    <div class="mb-5 flex items-center justify-between">
      <h1 class="text-2xl md:text-3xl dark:text-white">{$t('courses.heading')}</h1>
      {#if $isMobile}
        <PrimaryButton isDisabled={!$isOrgAdmin} onClick={openNewCourseModal}>
          <PlusIcon size={16} />
        </PrimaryButton>
=======
<section class="w-full">
  <div class="mb-5 flex items-center justify-between">
    <h1 class="text-2xl md:text-3xl dark:text-white">{$t('courses.heading')}</h1>
    {#if $isMobile}
      <PrimaryButton isDisabled={!$isOrgAdmin} onClick={openNewCourseModal}>
        <PlusIcon size={16} />
      </PrimaryButton>
    {:else}
      <PrimaryButton
        label={$t('courses.heading_button')}
        variant={VARIANTS.CONTAINED_DARK}
        isDisabled={!$isOrgAdmin}
        onClick={openNewCourseModal}
      />
    {/if}
  </div>
  <div class="mb-5 flex flex-row-reverse">
    <div class="filter-containter flex items-end justify-start gap-2">
      <div class="relative">
        <Input type="text" placeholder={$t('courses.search_placeholder')} bind:value={searchValue} class="pl-9" />

        <SearchIcon class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
      </div>
      <Select.Root type="single" bind:value={selectedId}>
        <Select.Trigger class="min-w-[150px]">
          <p>{selectedId ? selectedLabel : filterOptions[0].label}</p>
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
>>>>>>> feat/release-v2
      {:else}
        <IconButton onClick={() => setViewPreference('list')}>
          <ListIcon size={16} />
        </IconButton>
      {/if}
    </div>
<<<<<<< HEAD
    <div class="mb-5 flex flex-row-reverse">
      <div class="filter-containter flex items-end justify-start gap-2">
        <div class="relative">
          <Input type="text" placeholder={$t('courses.search_placeholder')} bind:value={searchValue} class="pl-9" />

          <SearchIcon class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        </div>
        <Select.Root type="single" bind:value={selectedId}>
          <Select.Trigger class="min-w-[150px]">
            <p>{selectedId ? selectedLabel : filterOptions[0].label}</p>
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

    <NewCourseModal />
    <Courses courses={filteredCourses} />
  </div>
=======
  </div>

  <NewCourseModal />
  <Courses courses={filteredCourses} />
>>>>>>> feat/release-v2
</section>
