<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import { Spinner } from '@cio/ui/base/spinner';
  import { GoalIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import CohortList from '../components/list.svelte';
  import type { Cohort } from '../utils/types';

  interface Props {
    cohorts?: Cohort[];
    isLMS?: boolean;
    isLoading?: boolean;
    searchValue?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    searchPlaceholder?: string;
    filterControls?: Snippet;
  }

  let {
    cohorts = [],
    isLMS = false,
    isLoading = false,
    searchValue = $bindable(''),
    emptyTitle = $t('cohorts.empty_title'),
    emptyDescription = $t('cohorts.empty_description'),
    searchPlaceholder = $t('cohorts.search_placeholder'),
    filterControls
  }: Props = $props();
</script>

<Page.BodyHeader align="right" class="p-0!">
  <Search placeholder={searchPlaceholder} bind:value={searchValue} />
  {@render filterControls?.()}
</Page.BodyHeader>

<div class="mx-auto mt-4 w-full flex-1">
  {#if isLoading}
    <div class="flex h-64 items-center justify-center">
      <Spinner />
    </div>
  {:else if !cohorts.length}
    <Empty title={emptyTitle} description={emptyDescription} icon={GoalIcon} variant="page" />
  {:else}
    <ResourceListRow.Group class="w-full">
      {#each cohorts as cohort (cohort.id)}
        <CohortList {cohort} {isLMS} />
      {/each}
    </ResourceListRow.Group>
  {/if}
</div>
