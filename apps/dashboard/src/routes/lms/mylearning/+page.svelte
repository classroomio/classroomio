<script lang="ts">
  import { Search } from 'carbon-components-svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { courses, courseMetaDeta, coursesComplete, coursesInProgress } from '$lib/components/Courses/store';
  import { untrack } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  let hasFetched = false;

  function onChange(tab) {
    return () => (currentTab = tab);
  }

  function getCourses(userId?: string, orgId?: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }

    // don't rerun this function if any state is updated in this function.
    untrack(async () => {
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
    });
  }

  $effect(() => {
    getCourses($profile.id, $currentOrg.id);
  });

  let tabs = $derived([
    {
      label: `${$t('my_learning.progress')} (${$coursesInProgress.length})`,
      value: '1'
    },
    {
      label: `${$t('my_learning.complete')} (${$coursesComplete.length})`,
      value: '2'
    }
  ]);
  let currentTab = $derived(tabs[0].value);
</script>

<section class="mx-auto max-w-6xl">
  <div class="m-2 md:m-5">
    <div role="searchbox" class=" w-full bg-gray-100 md:w-[60%] lg:w-[30%]">
      <Search placeholder={$t('my_learning.search')} class="dark:text-black" />
    </div>
    <h1 class="my-4 text-3xl font-semibold">{$t('my_learning.heading')}</h1>
    <Tabs {tabs} {currentTab} {onChange}>
      {#snippet content()}
        <slot:fragment>
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
      {/snippet}
    </Tabs>
  </div>
</section>
