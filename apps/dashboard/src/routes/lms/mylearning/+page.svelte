<script lang="ts">
  import { untrack } from 'svelte';
  import { Input } from '@cio/ui/base/input';
  import SearchIcon from '@lucide/svelte/icons/search';

  import Tabs from '$lib/components/Tabs/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { fetchCourses } from '$lib/utils/services/courses';
  import TabContent from '$lib/components/TabContent/index.svelte';

  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { courses, courseMetaDeta, coursesComplete, coursesInProgress } from '$lib/components/Courses/store';

  let hasFetched = false;
  let searchValue = $state('');

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
    <div role="searchbox" class="relative w-full md:w-[60%] lg:w-[30%]">
      <Input type="text" placeholder={$t('my_learning.search')} bind:value={searchValue} />
      <SearchIcon class="text-muted-foreground absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
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
