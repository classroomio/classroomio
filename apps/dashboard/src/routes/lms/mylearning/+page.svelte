<script lang="ts">
  import { browser } from '$app/environment';
  import Courses from '$lib/components/Courses/index.svelte';
  import { courseMetaDeta } from '$lib/components/Courses/store';
  import { lmsCourses } from '$lib/components/LMS/store';
  import { fetchPathways } from '$lib/components/Org/Pathway/api';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import { getIsPathwayComplete } from '$lib/utils/functions/pathway';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { LMSCourse } from '$lib/utils/types';
  import { Dropdown, Search } from 'carbon-components-svelte';

  import IconButton from '$lib/components/IconButton/index.svelte';
  import Grid from 'carbon-icons-svelte/lib/Grid.svelte';
  import List from 'carbon-icons-svelte/lib/List.svelte';

  import { onMount } from 'svelte';

  let hasFetched = false;
  let selectedId = '0';
  let filteredCourses: LMSCourse[] | any[] = [];
  let filteredCoursesInProgress: LMSCourse[] = [];
  let filteredCoursesCompleted: LMSCourse[] = [];
  let searching = false;
  let searchValue = '';
  let currentTab = '1';

  function onChange(tab) {
    filterCourses(searchValue, selectedId, $lmsCourses);
    return () => (currentTab = tab);
  }

  async function fetchPathwaysAndCourses(userId: string | undefined, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    if (!$lmsCourses.length) {
      $courseMetaDeta.isLoading = true;
    }

    try {
      const [pathwayResult, coursesResult] = await Promise.all([
        fetchPathways(userId, orgId),
        fetchCourses(userId, orgId)
      ]);

      if (!pathwayResult || !coursesResult) return;

      const pathwaysWithFlag = pathwayResult.allPathways.map((pathway) => ({
        ...pathway,
        isPathway: true
      }));

      const coursesWithFlag = coursesResult.allCourses.map((course) => ({
        ...course,
        isPathway: false
      }));

      const allResults: LMSCourse[] = [...pathwaysWithFlag, ...coursesWithFlag];

      lmsCourses.set(allResults);
      hasFetched = true;
      $courseMetaDeta.isLoading = false;
    } catch (error) {
      console.error('Error fetching pathways and courses:', error);
      $courseMetaDeta.isLoading = false;
    }
  }

  function filterCourses(searchValue: string, _selectedId: string, courses: LMSCourse[]) {
    if (browser) {
      if (!selectedId) {
        selectedId = localStorage.getItem('classroomio_filter_lms_mylearning_key') || '0';
      } else {
        localStorage.setItem('classroomio_filter_lms_mylearning_key', _selectedId);
      }
    }

    const filtered = courses.filter((course) => {
      return !searchValue || course.title.toLowerCase().includes(searchValue.toLowerCase());
    });

    if (_selectedId === '0') {
      filteredCourses = filtered.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (_selectedId === '1') {
      filteredCourses = filtered.filter((course) => course.isPathway);
    } else if (_selectedId === '2') {
      filteredCourses = filtered.filter((course) => course.isPathway == false);
    }

    // Filter the items render based on the current tab change
    if (currentTab === '1') {
      filteredCoursesInProgress = filteredCourses.filter((course) => {
        if (course.isPathway) {
          return getIsPathwayComplete(course) == false;
        }
        return course.total_lessons !== course.progress_rate;
      });
    } else if (currentTab === '2') {
      filteredCoursesCompleted = filteredCourses.filter((course) => {
        if (course.isPathway) {
          return getIsPathwayComplete(course);
        }
        return course.total_lessons === course.progress_rate;
      });
    }
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
  });

  $: if (browser && $profile.id && $currentOrg.id) {
    fetchPathwaysAndCourses($profile.id, $currentOrg.id);
    filterCourses(searchValue, selectedId, $lmsCourses);
  }

  $: tabs = [
    {
      label: `${$t('my_learning.progress')} (${filteredCoursesInProgress.length})`,
      value: '1'
    },
    {
      label: `${$t('my_learning.complete')} (${filteredCoursesCompleted.length})`,
      value: '2'
    }
  ];
</script>

<section class="mx-auto max-w-6xl">
  <div class="m-2 md:m-5">
    <div class="mb-5 flex items-center justify-between">
      <h1 class="my-4 text-3xl font-semibold">{$t('my_learning.heading')}</h1>

      <div class="mb-5 flex flex-row-reverse">
        <div class="filter-containter flex items-end justify-start">
          <Search
            placeholder={$t('my_learning.search')}
            class="dark:text-black"
            bind:value={searchValue}
            searchClass="mr-2"
          />
          <Dropdown
            class="h-full min-w-[150px]"
            bind:selectedId
            items={[
              { id: '0', text: $t('org_navigation.all_courses') },
              { id: '1', text: $t('org_navigation.pathway') },
              { id: '2', text: $t('org_navigation.courses') }
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
    </div>

    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <TabContent value={tabs[0].value} index={currentTab}>
          <Courses
            {searching}
            courses={filteredCoursesInProgress}
            emptyTitle={$t('my_learning.not_in_progress')}
            emptyDescription={$t('my_learning.any_progress')}
          />
        </TabContent>
        <TabContent value={tabs[1].value} index={currentTab}>
          <Courses
            {searching}
            courses={filteredCoursesCompleted}
            emptyTitle={$t('my_learning.not_completed')}
            emptyDescription={$t('my_learning.any_course')}
          />
        </TabContent>
      </slot:fragment>
    </Tabs>
  </div>
</section>

<style>
  .filter-containter :global(.bx--dropdown) {
    max-height: unset;
    height: 100%;
  }
</style>
