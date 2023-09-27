<script lang="ts">
  import { onMount } from 'svelte';
  import { Search, Dropdown } from 'carbon-components-svelte';
  import { page } from '$app/stores';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/components/Courses/api';
  import Courses from '$lib/components/Courses/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { courses, createCourseModal, courseMetaDeta } from '$lib/components/Courses/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { Add } from 'carbon-icons-svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import type { Course } from '$lib/utils/types';
  import { browser } from '$app/environment';

  export let data;
  let { allCourses, cantFetch } = data;
  let searchValue = '';
  let selectedId: string;
  let filteredCourses: Course[];
  let hasFetched = false;

  const urlParams = new URLSearchParams($page.url.search);

  if (urlParams.get('create') === 'true') {
    $createCourseModal.open = true;
  }

  async function getCourses(userId: string | null, orgId: string) {
    if (cantFetch && typeof cantFetch === 'boolean' && !allCourses.length && orgId && !hasFetched) {
      $courseMetaDeta.isLoading = true;

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

  onMount(() => {
    courses.set(allCourses);
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
