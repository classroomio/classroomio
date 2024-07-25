<script lang="ts">
  import { Dropdown, Search } from 'carbon-components-svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { fetchCourses } from '$lib/components/Courses/api';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import {
    courses,
    courseMetaDeta,
    coursesComplete,
    coursesInProgress
  } from '$lib/components/Courses/store';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';

  let hasFetched = false;
  let selectedId = '0';

  function onChange(tab) {
    return () => (currentTab = tab);
  }

  async function getCourses(userId: string | null, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    hasFetched = true;

    // only show is loading when fetching for the first time
    if (!$courses.length) {
      $courseMetaDeta.isLoading = true;
    }

    const coursesResult = await fetchCourses(userId, orgId);
    console.log(`get courses result`, coursesResult);

    $courseMetaDeta.isLoading = false;
    if (!coursesResult) return;

    courses.set(coursesResult.allCourses);
    hasFetched = true;
  }

  $: if (browser && $profile.id && $currentOrg.id) {
    getCourses($profile.id, $currentOrg.id);
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
              { id: '0', text: 'All Courses' },
              { id: '1', text: 'Pathways' }
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
