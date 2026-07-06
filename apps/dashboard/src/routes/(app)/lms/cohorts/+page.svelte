<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '$features/cohort/api';
  import { profile } from '$lib/utils/store/user';
  import { CohortsPage } from '$features/cohort/pages';

  let searchValue = $state('');

  $effect(() => {
    if ($profile.id) {
      cohortApi.listEnrolledCohorts();
    }
  });

  const cohorts = $derived(cohortApi.cohorts);
  const filteredCohorts = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return cohorts.filter((cohort) => {
      if (!normalizedSearch) {
        return true;
      }

      return [cohort.name, cohort.description].some((value) => value?.toLowerCase().includes(normalizedSearch));
    });
  });
</script>

<svelte:head>
  <title>{$t('lms_navigation.cohorts') || 'Cohorts'} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('lms_navigation.cohorts') || 'Cohorts'}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CohortsPage
        cohorts={filteredCohorts}
        isLMS={true}
        isLoading={cohortApi.isLoading && cohorts.length === 0}
        bind:searchValue
        emptyTitle={$t('cohorts.lms.empty_title') || 'No cohorts yet'}
        emptyDescription={$t('cohorts.lms.empty_description')}
      />
    {/snippet}
  </Page.Body>
</Page.Root>
