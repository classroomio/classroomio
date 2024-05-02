<script lang="ts">
  import { Popover, SkeletonText } from 'carbon-components-svelte';
  import ChevronSort from 'carbon-icons-svelte/lib/ChevronSort.svelte';
  import OrgSelectorItem from './OrgSelectorItem.svelte';
  import { currentOrg, orgs, currentOrgPath, currentOrgPlan } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { newOrgModal } from '$lib/components/Org/store';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import Plan from '$lib/components/Chip/Plan.svelte';
  import { PLAN_NAMES } from 'shared/src/plans/constants';
  import { t } from '$lib/utils/functions/translations';

  export let canAddOrg = true;

  let open = false;

  function handleAddOrg() {
    open = false;
    $newOrgModal.open = true;
  }

  function onClick(org: CurrentOrg) {
    localStorage.setItem('classroomio_org_sitename', org.siteName);
    currentOrg.set(org);

    setTheme(org.theme);
    goto($currentOrgPath);

    open = false;
  }
</script>

<div
  class="org-selector px-4 py-3 border border-l-0 border-r-0 border-t-0 border-gray-200 dark:border-neutral-600 relative"
  data-outline
>
  {#if $currentOrg.name}
    <button
      class="flex items-center gap-2 w-full"
      on:click={(e) => {
        e.stopPropagation();
        open = !open;
      }}
    >
      {#if $currentOrg.avatar_url && $currentOrg.name}
        <Avatar
          src={$currentOrg.avatar_url}
          name={$currentOrg.name}
          shape="rounded-md"
          width="w-7"
          height="h-7"
        />
      {:else if $currentOrg.shortName}
        <TextChip
          size="sm"
          value={$currentOrg.shortName}
          className="bg-primary-200 dark:text-black font-medium"
        />
      {/if}
      <div class="flex items-center cursor-pointer max-w-[219px] justify-between w-full">
        <div class="flex flex-col items-start">
          <p class="dark:text-white text-sm font-medium whitespace-nowrap truncate mb-1">
            {$currentOrg.name}
          </p>

          <Plan name={$currentOrgPlan ? PLAN_NAMES[$currentOrgPlan.plan_name] : PLAN_NAMES.BASIC} />
        </div>
        <ChevronSort size={16} />
      </div>
    </button>
  {:else}
    <div class="w-[219px] h-[30px]">
      <SkeletonText style="width: 100%; height: 100%;" />
    </div>
  {/if}

  {#if canAddOrg}
    <Popover class="w-[95%] left-[2%] rounded-md" bind:open closeOnOutsideClick align="bottom-left">
      {#each $orgs as org}
        <OrgSelectorItem
          size="sm"
          active={$currentOrg.id === org.id}
          avatar={org.avatar_url}
          avatarText={org.shortName}
          text={org.name}
          hasDivider={true}
          onClick={() => onClick(org)}
        />
      {/each}

      <OrgSelectorItem
        disabled={true}
        size=""
        text={$t('navigation.add_organization')}
        onClick={handleAddOrg}
      />
    </Popover>
  {/if}
</div>

<style>
  :global(.org-selector .bx--popover-contents) {
    width: 100%;
  }
</style>
