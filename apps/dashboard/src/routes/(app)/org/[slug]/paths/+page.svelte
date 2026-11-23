<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import { Empty } from '@cio/ui/custom/empty';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { learningPathApi } from '$features/learning-path/api/learning-path.svelte';
  import LearningPathCard from '$features/learning-path/components/learning-path-card.svelte';
  import LearningPathOverview from '$features/learning-path/components/learning-path-overview.svelte';
  import CreateLearningPathModal from '$features/learning-path/components/create-learning-path-modal.svelte';
  import { LEARNING_PATH_STATUS_KEYS } from '$features/learning-path/utils/learning-path-utils';
  import type { LearningPathStatus } from '$features/learning-path/utils/types';

  type StatusFilter = LearningPathStatus | 'ALL';

  let showCreateModal = $state(false);
  let searchValue = $state('');
  let statusFilter = $state<StatusFilter>('ALL');
  let listedOrgId = '';

  $effect(() => {
    const organizationId = $currentOrg.id;
    if (!organizationId || organizationId === listedOrgId) return;

    listedOrgId = organizationId;
    learningPathApi.list = null;
    void learningPathApi.listPaths();
  });

  const statusOptions = $derived<{ value: StatusFilter; label: string }[]>([
    { value: 'ALL', label: $t('learning_paths.filters.all_statuses') },
    { value: 'ACTIVE', label: $t(LEARNING_PATH_STATUS_KEYS.ACTIVE) },
    { value: 'DRAFT', label: $t(LEARNING_PATH_STATUS_KEYS.DRAFT) },
    { value: 'ARCHIVED', label: $t(LEARNING_PATH_STATUS_KEYS.ARCHIVED) }
  ]);

  const paths = $derived(learningPathApi.list?.paths ?? null);
  const filteredPaths = $derived.by(() => {
    if (!paths) return null;

    const query = searchValue.trim().toLowerCase();

    return paths.filter((path) => {
      const matchesSearch = !query || path.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'ALL' || path.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  });
</script>

<svelte:head>
  <title>{$t('learning_paths.heading')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('learning_paths.heading')}</Page.Title>
      <Page.Subtitle>{$t('learning_paths.description')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <div class="flex items-center gap-2">
        <Button variant="secondary" href={resolve(`${$currentOrgPath}/courses?create=true`, {})}>
          {$t('learning_paths.create_course')}
        </Button>
        {#if $isOrgAdmin}
          <Button onclick={() => (showCreateModal = true)} testId="learning-path-create">
            <Plus size={16} />
            {$t('learning_paths.create')}
          </Button>
        {/if}
      </div>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <div class="flex flex-col gap-6">
        <LearningPathOverview overview={learningPathApi.list?.overview ?? null} />

        {#if paths && paths.length === 0}
          <Empty
            title={$t('learning_paths.empty_title')}
            description={$t('learning_paths.empty_description')}
            icon={PathIcon}
            variant="page"
          >
            <div class="flex items-center gap-2">
              <Button variant="secondary" href={resolve(`${$currentOrgPath}/courses?create=true`, {})}>
                {$t('learning_paths.create_course')}
              </Button>
              {#if $isOrgAdmin}
                <Button onclick={() => (showCreateModal = true)}>
                  <Plus size={16} />
                  {$t('learning_paths.create')}
                </Button>
              {/if}
            </div>
          </Empty>
        {:else}
          <div class="flex flex-wrap items-center gap-2">
            <Input
              class="max-w-xs"
              placeholder={$t('learning_paths.search_placeholder')}
              bind:value={searchValue}
              aria-label={$t('learning_paths.search_placeholder')}
            />
            <Select.Root type="single" bind:value={statusFilter}>
              <Select.Trigger class="w-44" aria-label={$t('learning_paths.filters.status')}>
                {statusOptions.find((option) => option.value === statusFilter)?.label}
              </Select.Trigger>
              <Select.Content>
                {#each statusOptions as option (option.value)}
                  <Select.Item value={option.value}>{option.label}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {#if !filteredPaths}
              {#each [0, 1, 2] as index (index)}
                <LearningPathCard loading />
              {/each}
            {:else}
              {#each filteredPaths as path (path.id)}
                <LearningPathCard {path} />
              {/each}
            {/if}
          </div>

          {#if filteredPaths && filteredPaths.length === 0}
            <p class="ui:text-muted-foreground text-sm">{$t('learning_paths.no_matches')}</p>
          {/if}
        {/if}
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>

<CreateLearningPathModal bind:open={showCreateModal} />
