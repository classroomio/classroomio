<script lang="ts">
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { CoursesPage } from '$features/course/pages';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';
  import { coursesApi } from '$features/course/api';

  let searchValue = $state('');

  const coursesInProgress = $derived(coursesApi.enrolledCourses.filter((course) => course.lessonCount !== course.progressRate));
  const coursesComplete = $derived(coursesApi.enrolledCourses.filter((course) => course.lessonCount === course.progressRate));

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    coursesApi.getEnrolledCourses();
  });

  let tabs = $derived([
    {
      label: `${$t('my_learning.progress')} (${coursesInProgress.length})`,
      value: '1'
    },
    {
      label: `${$t('my_learning.complete')} (${coursesComplete.length})`,
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
      bind:searchValue
      courses={coursesInProgress}
      emptyDescription={$t('my_learning.any_progress')}
      emptyTitle={$t('my_learning.not_in_progress')}
      isLMS={true}
      isLoading={coursesApi.isLoading}
    />
  </UnderlineTabs.Content>
  <UnderlineTabs.Content value={tabs[1].value}>
    <CoursesPage
      bind:searchValue
      courses={coursesComplete}
      emptyDescription={$t('my_learning.any_course')}
      emptyTitle={$t('my_learning.not_completed')}
      isLMS={true}
      isLoading={coursesApi.isLoading}
    />
  </UnderlineTabs.Content>
</UnderlineTabs.Root>
