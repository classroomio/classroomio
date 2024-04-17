<script lang="ts">
  import { Search, Dropdown } from 'carbon-components-svelte';
  import { page } from '$app/stores';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/components/Courses/api';
  import Courses from '$lib/components/Courses/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courses, createCourseModal, courseMetaDeta, view } from '$lib/components/Courses/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { Add, Application } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { browser } from '$app/environment';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import TableOfContents from 'carbon-icons-svelte/lib/TableOfContents.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';
  import { onMount } from 'svelte';

  export let data;
  let { cantFetch } = data;
  let searchValue = '';
  let selectedId: string;
  let filteredCourses: Course[];
  let hasFetched = false;

  const urlParams = new URLSearchParams($page.url.search);

  if (urlParams.get('create') === 'true') {
    $createCourseModal.open = true;
  }

  async function getCourses(userId: string | null, orgId: string) {
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

  const setViewPreference = (preference: string) => {
    $view = preference;
    localStorage.setItem('view', preference);
  };

  onMount(() => {
    const storedView = localStorage.getItem('view');
    if (storedView) {
      $view = storedView;
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
      <h1 class="dark:text-white text-2xl md:text-3xl font-bold">Courses</h1>
      {#if $isMobile}
        <PrimaryButton isDisabled={!$isOrgAdmin} onClick={() => ($createCourseModal.open = true)}>
          <Add size={24} />
        </PrimaryButton>
      {:else}
        <PrimaryButton
          label="Create Course"
          variant={VARIANTS.CONTAINED_DARK}
          isDisabled={!$isOrgAdmin}
          onClick={() => ($createCourseModal.open = true)}
        />
      {/if}
    </div>
    <div class="flex flex-row-reverse mb-5">
      <div class="flex items-end justify-start">
        <Search
          placeholder="Find course"
          bind:value={searchValue}
          searchClass="mr-2"
          class=" bg-gray-100 dark:bg-neutral-800"
        />
        <Dropdown
          class="h-full"
          bind:selectedId
          items={[
            { id: '0', text: 'Date Created' },
            { id: '1', text: 'Published' },
            { id: '2', text: 'Lessons' }
          ]}
        />
        {#if $view === 'list'}
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
  :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
