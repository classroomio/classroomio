<script lang="ts">
  import Chip from '$lib/components/Chip/index.svelte';
  import RoleBaseSecurity from '$lib/components/RoleBasedSecurity/index.svelte';
  import { Add } from 'carbon-icons-svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import type { TabsType } from '../types';

  export let onCreate: () => void;
  export let tabs: TabsType = [];

  export let selectedTab: number;
</script>

<div class="mb-3 flex items-center justify-between">
  <div>
    {#each tabs as tab}
      <button
        class="mr-3 pb-2 border-t-0 border-l-0 border-r-0 {selectedTab === tab.value
          ? 'border-b-4 border-indigo-600 focus:border-indigo-600'
          : 'border-b-0'}"
        on:click={() => (selectedTab = tab.value)}
      >
        {tab.label}
        <Chip bind:value={tab.number} />
      </button>
    {/each}
  </div>

  <RoleBaseSecurity allowedRoles={[1, 2]}>
    <IconButton onClick={onCreate} contained={true} size="large">
      <Add size={16} />
    </IconButton>
  </RoleBaseSecurity>
</div>
