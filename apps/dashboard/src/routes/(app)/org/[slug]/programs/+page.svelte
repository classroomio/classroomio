<script lang="ts">
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { GoalIcon } from '@cio/ui/custom/moving-icons';
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import { programApi } from '$features/program/api';
  import { ProgramsPage } from '$features/program/pages';
  import type { Program } from '$features/program/utils/types';
  import CreateProgramModal from '$features/program/components/create-program-modal.svelte';
  import {
    DEFAULT_PROGRAM_SORT,
    DEFAULT_PROGRAM_SORT_ORDER,
    type ProgramSortBy,
    type ProgramSortOrder
  } from '$features/program/utils/constants';
  import ProgramFilterPopover from '$features/program/components/program-filter-popover.svelte';
  import { SvelteSet } from 'svelte/reactivity';

  let { data } = $props();

  let showCreateModal = $state(false);
  let searchValue = $state('');
  let sortKey = $state<ProgramSortBy>(DEFAULT_PROGRAM_SORT);
  let selectedOrder = $state<ProgramSortOrder>(DEFAULT_PROGRAM_SORT_ORDER);
  let selectedStatuses = $state<string[]>([]);

  $effect(() => {
    if (data.programs) {
      programApi.programs = data.programs;
    }
  });

  const statusOptions = $derived([
    { value: 'ACTIVE' as const, label: $t('programs.status.active') || 'Active' },
    { value: 'INACTIVE' as const, label: $t('programs.status.inactive') || 'Inactive' },
    { value: 'ARCHIVED' as const, label: $t('programs.status.archived') || 'Archived' }
  ]);

  const sortOptions = $derived([
    { value: 'name' as const, label: $t('programs.filters.sort_name') || 'Name' },
    { value: 'courses' as const, label: $t('programs.filters.sort_courses') || 'Courses' },
    { value: 'students' as const, label: $t('programs.filters.sort_students') || 'Students' },
    { value: 'status' as const, label: $t('programs.filters.sort_status') || 'Status' }
  ]);

  const filteredPrograms = $derived.by(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const sourcePrograms = programApi.programs.filter((program: Program) => {
      const matchesSearch =
        !normalizedSearch ||
        [program.name, program.description].some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(program.status);

      return matchesSearch && matchesStatus;
    });

    const sortedPrograms = [...sourcePrograms];

    return sortedPrograms.sort((firstProgram, secondProgram) => {
      let comparison = 0;

      if (sortKey === 'name') {
        comparison = firstProgram.name.localeCompare(secondProgram.name);
      } else if (sortKey === 'courses') {
        comparison = firstProgram.courseCount - secondProgram.courseCount;
      } else if (sortKey === 'students') {
        comparison = firstProgram.studentCount - secondProgram.studentCount;
      } else if (sortKey === 'status') {
        comparison = firstProgram.status.localeCompare(secondProgram.status);
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
    sortKey = DEFAULT_PROGRAM_SORT;
    selectedOrder = DEFAULT_PROGRAM_SORT_ORDER;
    selectedStatuses = [];
  }
</script>

<svelte:head>
  <title>{$t('programs.page_title') || 'Programs'} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('programs.heading') || 'Programs'}</Page.Title>
      <Page.Subtitle>
        {$t('programs.description') || 'Give a group of people access to multiple courses, like a class'}
      </Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button onclick={() => (showCreateModal = true)}>
        <Plus size={16} />
        {$t('programs.create') || 'New Program'}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      {#if !programApi.isLoading && filteredPrograms.length === 0 && !searchValue.trim() && selectedStatuses.length === 0}
        <Empty
          title={$t('programs.empty_title') || 'No programs yet'}
          description={$t('programs.empty_description') || 'Create your first program to get started.'}
          icon={GoalIcon}
          variant="page"
        >
          <Button onclick={() => (showCreateModal = true)}>
            <Plus size={16} />
            {$t('programs.create') || 'New Program'}
          </Button>
        </Empty>
      {:else}
        <ProgramsPage
          programs={filteredPrograms}
          isLoading={programApi.isLoading && filteredPrograms.length === 0}
          bind:searchValue
          emptyTitle={$t('programs.empty_title') || 'No programs yet'}
          emptyDescription={searchValue.trim() || selectedStatuses.length > 0
            ? $t('programs.no_matching_programs') || 'No programs match your filters.'
            : $t('programs.empty_description') || 'Create your first program to get started.'}
        >
          {#snippet filterControls()}
            <ProgramFilterPopover
              bind:sortKey
              bind:selectedOrder
              {selectedStatuses}
              {statusOptions}
              {sortOptions}
              onToggleStatus={toggleStatus}
              onClearFilters={clearFilters}
            />
          {/snippet}
        </ProgramsPage>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<CreateProgramModal bind:open={showCreateModal} />
