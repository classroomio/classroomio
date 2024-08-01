<script lang="ts">
  import { Dropdown, Search } from 'carbon-components-svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { fetchCourses } from '$lib/components/Courses/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';

  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';
  import {
    coursesComplete,
    coursesInProgress,
    lms_courses,
    lmsCourseMetaDeta
  } from '$lib/components/LMS/store';
  import { fetchPathways } from '$lib/components/Org/PathWay/api';

  let hasFetched = false;
  let selectedId = '0';

  function onChange(tab) {
    return () => (currentTab = tab);
  }

  async function fetchPathwaysAndCourses(userId: string | undefined, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    if (!$lms_courses.length) {
      $lmsCourseMetaDeta.isLoading = true;
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

      const allResults = [...pathwaysWithFlag, ...coursesWithFlag];

      lms_courses.set(allResults);
      hasFetched = true;
    } catch (error) {
      console.error('Error fetching pathways and courses:', error);
      $lmsCourseMetaDeta.isLoading = false;
    }
  }

  $: if (browser && $profile.id && $currentOrg.id) {
    fetchPathwaysAndCourses($profile.id, $currentOrg.id);
  }

  $: tabs = [
    {
      label: `${$t('my_learning.progress')} (${$coursesInProgress.length})`,
      value: '1'
    },
    {
      label: `${$t('my_learning.complete')} (${$coursesComplete.length})`,
      value: '2'
    }
  ];
  $: currentTab = tabs[0].value;
</script>

<section class="max-w-6xl mx-auto">
  <div class="m-2 md:m-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-3xl font-semibold my-4">{$t('my_learning.heading')}</h1>

      <div class="flex flex-row-reverse mb-5">
        <div class="filter-containter flex items-end justify-start">
          <Search
            placeholder={$t('my_learning.search')}
            class="dark:text-black"
            searchClass="mr-2"
          />
          <Dropdown
            class="h-full min-w-[150px]"
            bind:selectedId
            items={[
              { id: '0', text: $t('org_navigation.all_courses') },
              { id: '1', text: $t('org_navigation.pathway') }
            ]}
          />
        </div>
      </div>
    </div>

    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <TabContent value={tabs[0].value} index={currentTab}>
          <Courses
            courses={$coursesInProgress}
            emptyTitle={$t('my_learning.not_in_progress')}
            emptyDescription={$t('my_learning.any_progress')}
          />
        </TabContent>
        <TabContent value={tabs[1].value} index={currentTab}>
          <Courses
            courses={$coursesComplete}
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
