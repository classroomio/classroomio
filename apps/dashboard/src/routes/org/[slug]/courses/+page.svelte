<script lang="ts">
  import { Search, Dropdown } from 'carbon-components-svelte';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/components/Courses/api';
  import Courses from '$lib/components/Courses/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courses, courseMetaDeta } from '$lib/components/Courses/store';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { Add } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations.js';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  export let data;

  let { cantFetch } = data;
  let searchValue = '';
  let selectedId: string;
  let filteredCourses: Course[];
  let hasFetched = false;

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

    filteredCourses = courses.filter((course) => {
      if (!searchValue || course.title.toLowerCase().includes(searchValue)) {
        return true;
      }

      return false;
    });

    if (_selectedId === '0') {
      filteredCourses = filteredCourses.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (_selectedId === '1') {
      filteredCourses = filteredCourses.sort((a, b) => b.is_published - a.is_published);
    } else if (_selectedId === '2') {
      filteredCourses = filteredCourses.sort((a, b) => b.total_lessons - a.total_lessons);
    }
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

  $: filterCourses(searchValue, selectedId, $courses);
  $: getCourses($profile.id, $currentOrg.id);
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<section class="w-full md:max-w-6xl md:mx-auto">
  <div class="py-2 md:py-10 px-2 md:px-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">{$t('courses.heading')}</h1>
      {#if $isMobile}
        <PrimaryButton isDisabled={!$isOrgAdmin} onClick={openNewCourseModal}>
          <Add size={24} />
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
    <div class="flex flex-row-reverse mb-5">
      <div class="filter-containter flex items-end justify-start">
        <Search
          placeholder={$t('courses.search_placeholder')}
          bind:value={searchValue}
          searchClass="mr-2"
          class=" bg-gray-100 dark:bg-neutral-800"
        />
        <Dropdown
          class="h-full"
          bind:selectedId
          items={[
            { id: '0', text: $t('courses.course_filter.date_created') },
            { id: '1', text: $t('courses.course_filter.published') },
            { id: '2', text: $t('courses.course_filter.lessons') }
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

    <NewCourseModal />
    <Courses bind:courses={filteredCourses} />
  </div>
</section>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
