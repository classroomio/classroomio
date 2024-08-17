<script lang="ts">
  import { Moon } from 'svelte-loading-spinners';

  import { globalStore } from '$lib/utils/store/app';
  import { pathway } from '$lib/components/Pathways/store';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import PathwaySidebar from '$lib/components/Pathways/components/Sidebar.svelte';

  export let path = '';
  export let className: string = '';
  export let isFetching = false;
</script>

<svelte:head>
  <title>{$pathway.title || 'ClassroomIO Pathway'}</title>
</svelte:head>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

<div class="root">
  <PathwaySidebar {path} isStudent={$globalStore.isStudent} />
  <div class="{className} rightBar">
    <slot />
  </div>
</div>

<style>
  .root {
    display: flex;
    width: 100%;
  }

  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
  }
</style>
