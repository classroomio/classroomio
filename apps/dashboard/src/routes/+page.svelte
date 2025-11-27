<script>
  import { appInitApi } from '$lib/features/app/init.svelte';
  import { Circle } from 'svelte-loading-spinners';
</script>

<svelte:head>
  <title>ClassroomIO - Beautiful and Robust Course Platform</title>
</svelte:head>

<div class="m-2 flex w-screen flex-col items-center justify-center font-sans sm:m-0 md:min-h-[93vh] dark:bg-black">
  {#if appInitApi.loading || appInitApi.data}
    <Circle size="50" color="#1d4ee2" unit="px" duration="1s" />
  {:else if appInitApi.error}
    <p class="text-red-500">{appInitApi.error}</p>
  {/if}
</div>
