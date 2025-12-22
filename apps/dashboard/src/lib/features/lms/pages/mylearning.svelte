<script lang="ts">
  import { untrack } from 'svelte';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { CoursesPage } from '$features/course/pages';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { courses, courseMetaDeta, coursesComplete, coursesInProgress } from '$features/course/utils/store';

  let hasFetched = false;
  let searchValue = $state('');

  function getCourses(userId?: string, orgId?: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }

    untrack(async () => {
      hasFetched = true;

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
  let currentTab = $state('1');
</script>

<UnderlineTabs.Root bind:value={currentTab}>
  <UnderlineTabs.List>
    {#each tabs as tab}
      <UnderlineTabs.Trigger value={tab.value}>
        {$t(tab.label)}
      </UnderlineTabs.Trigger>
    {/each}
  </UnderlineTabs.List>
  <UnderlineTabs.Content value={tabs[0].value}>
    <CoursesPage
      courses={$coursesInProgress}
      emptyTitle={$t('my_learning.not_in_progress')}
      emptyDescription={$t('my_learning.any_progress')}
      bind:searchValue
      isLMS={true}
    />
  </UnderlineTabs.Content>
  <UnderlineTabs.Content value={tabs[1].value}>
    <CoursesPage
      courses={$coursesComplete}
      emptyTitle={$t('my_learning.not_completed')}
      emptyDescription={$t('my_learning.any_course')}
      bind:searchValue
      isLMS={true}
    />
  </UnderlineTabs.Content>
</UnderlineTabs.Root>
