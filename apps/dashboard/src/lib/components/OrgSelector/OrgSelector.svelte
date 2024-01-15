<script lang="ts">
  import { Popover, SkeletonText } from 'carbon-components-svelte';
  import CaretDown from 'carbon-icons-svelte/lib/CaretDown.svelte';
  import OrgSelectorItem from './OrgSelectorItem.svelte';
  import { currentOrg, orgs, currentOrgPath } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { newOrgModal } from '$lib/components/Org/store';
  import type { CurrentOrg } from '$lib/utils/types/org';
  import { setTheme } from '$lib/utils/functions/theme';

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

<div class="mt-5 relative" data-outline>
  {#if $currentOrg.name}
    <button
      class="flex items-center cursor-pointer max-w-[219px]"
      on:click={(e) => {
        e.stopPropagation();
        open = !open;
      }}
    >
      <p class="dark:text-white text-lg font-bold whitespace-nowrap truncate">
        {$currentOrg.name}
      </p>
      <CaretDown size={16} class="ml-2" />
    </button>
  {:else}
    <div class="w-[219px] h-[30px]">
      <SkeletonText style="width: 100%; height: 100%;" />
    </div>
  {/if}
  {#if canAddOrg}
    <Popover bind:open closeOnOutsideClick align="bottom-left">
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

      <OrgSelectorItem size="" text=" + Add Organization" onClick={handleAddOrg} />
    </Popover>
  {/if}
</div>
