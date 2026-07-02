<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { GoalIcon } from '@cio/ui/custom/moving-icons';
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import { cohortApi } from '$features/cohort/api';
  import { CohortsPage } from '$features/cohort/pages';
  import type { Cohort } from '$features/cohort/utils/types';
  import CreateCohortModal from '$features/cohort/components/create-cohort-modal.svelte';
  import {
    DEFAULT_COHORT_SORT,
    DEFAULT_COHORT_SORT_ORDER,
    type CohortSortBy,
    type CohortSortOrder
  } from '$features/cohort/utils/constants';
  import CohortFilterPopover from '$features/cohort/components/cohort-filter-popover.svelte';
  import { SvelteSet } from 'svelte/reactivity';

  let { data } = $props();

  let showCreateModal = $state(false);
  let searchValue = $state('');
  let sortKey = $state<CohortSortBy>(DEFAULT_COHORT_SORT);
  let selectedOrder = $state<CohortSortOrder>(DEFAULT_COHORT_SORT_ORDER);
  let selectedStatuses = $state<string[]>([]);

  $effect(() => {
    if (data.cohorts) {
      cohortApi.cohorts = data.cohorts;
    }
  });

  const statusOptions = $derived([
    { value: 'ACTIVE' as const, label: $t('cohorts.status.active') || 'Active' },
    { value: 'INACTIVE' as const, label: $t('cohorts.status.inactive') || 'Inactive' },
    { value: 'ARCHIVED' as const, label: $t('cohorts.status.archived') || 'Archived' }
  ]);

  const sortOptions = $derived([
    { value: 'name' as const, label: $t('cohorts.filters.sort_name') || 'Name' },
    { value: 'courses' as const, label: $t('cohorts.filters.sort_courses') || 'Courses' },
    { value: 'students' as const, label: $t('cohorts.filters.sort_students') || 'Students' },
    { value: 'status' as const, label: $t('cohorts.filters.sort_status') || 'Status' }
  ]);

  const filteredCohorts = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const sourceCohorts = cohortApi.cohorts.filter((item: Cohort) => {
      const matchesSearch =
        !normalizedSearch ||
        [item.name, item.description].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);

      return matchesSearch && matchesStatus;
    });

    const sortedCohorts = [...sourceCohorts];

    return sortedCohorts.sort((firstCohort, secondCohort) => {
      let comparison = 0;

      if (sortKey === 'name') {
        comparison = firstCohort.name.localeCompare(secondCohort.name);
      } else if (sortKey === 'courses') {
        comparison = firstCohort.courseCount - secondCohort.courseCount;
      } else if (sortKey === 'students') {
        comparison = firstCohort.studentCount - secondCohort.studentCount;
      } else if (sortKey === 'status') {
        comparison = firstCohort.status.localeCompare(secondCohort.status);
      }

      return selectedOrder === 'asc' ? comparison : comparison * -1;
    });
  });

  function toggleStatus(status: string, checked: boolean) {
    const nextStatuses = new SvelteSet(selectedStatuses);
    if (checked) {
      nextStatuses.add(status);
    } else {
      nextStatuses.delete(status);
    }

    selectedStatuses = Array.from(nextStatuses);
  }

  function clearFilters() {
    sortKey = DEFAULT_COHORT_SORT;
    selectedOrder = DEFAULT_COHORT_SORT_ORDER;
    selectedStatuses = [];
  }
</script>

<svelte:head>
  <title>{$t('cohorts.page_title') || 'Cohorts'} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('cohorts.heading') || 'Cohorts'}</Page.Title>
      <Page.Subtitle>
        {$t('cohorts.description') || 'Give a group of people access to multiple courses, like a class'}
      </Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button onclick={() => (showCreateModal = true)}>
        <Plus size={16} />
        {$t('cohorts.create') || 'New Program'}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if !cohortApi.isLoading && filteredCohorts.length === 0 && !searchValue.trim() && selectedStatuses.length === 0}
        <Empty
          title={$t('cohorts.empty_title') || 'No cohorts yet'}
          description={$t('cohorts.empty_description') || 'Create your first cohort to get started.'}
          icon={GoalIcon}
          variant="page"
        >
          <Button onclick={() => (showCreateModal = true)}>
            <Plus size={16} />
            {$t('cohorts.create') || 'New Program'}
          </Button>
        </Empty>
      {:else}
        <CohortsPage
          cohorts={filteredCohorts}
          isLoading={cohortApi.isLoading && filteredCohorts.length === 0}
          bind:searchValue
          emptyTitle={$t('cohorts.empty_title') || 'No cohorts yet'}
          emptyDescription={searchValue.trim() || selectedStatuses.length > 0
            ? $t('cohorts.no_matching_cohorts') || 'No cohorts match your filters.'
            : $t('cohorts.empty_description') || 'Create your first cohort to get started.'}
        >
          {#snippet filterControls()}
            <CohortFilterPopover
              bind:sortKey
              bind:selectedOrder
              {selectedStatuses}
              {statusOptions}
              {sortOptions}
              onToggleStatus={toggleStatus}
              onClearFilters={clearFilters}
            />
          {/snippet}
        </CohortsPage>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<CreateCohortModal bind:open={showCreateModal} />
