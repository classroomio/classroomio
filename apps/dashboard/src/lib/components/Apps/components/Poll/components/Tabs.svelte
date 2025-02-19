<script lang="ts">
  import Chip from '$lib/components/Chip/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { RoleBasedSecurity } from '$lib/components/RoleBasedSecurity';
  import { Add } from 'carbon-icons-svelte';
  import type { TabsType } from '../types';

  export let onCreate: () => void;
  export let tabs: TabsType = [];

  export let selectedTab: number;
</script>

<div class="mb-3 flex items-center justify-between">
  <div>
    {#each tabs as tab}
      <button
        class="mr-3 border-l-0 border-r-0 border-t-0 pb-2 {selectedTab === tab.value
          ? 'border-primary-600 focus:border-primary-600 border-b-4'
          : 'border-b-0'}"
        on:click={() => (selectedTab = tab.value)}
      >
        {tab.label}
        <Chip bind:value={tab.number} />
      </button>
    {/each}
  </div>

  <RoleBasedSecurity allowedRoles={[1, 2]}>
    <IconButton onClick={onCreate} contained={true} size="large">
      <Add size={16} />
    </IconButton>
  </RoleBasedSecurity>
</div>
