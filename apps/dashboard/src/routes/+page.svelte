<script>
  import { appInitApi } from '$lib/features/app/init.svelte';
  import { Spinner } from '@cio/ui/base/spinner';
</script>

<svelte:head>
  <title>ClassroomIO - Beautiful and Robust Course Platform</title>
</svelte:head>

<div class="m-2 flex h-screen w-screen flex-col items-center justify-center font-sans sm:m-0">
  {#if appInitApi.loading || appInitApi.data}
    <Spinner class="size-14! text-blue-700!" />
  {:else if appInitApi.error}
    <p class="text-red-500">{appInitApi.error}</p>
  {/if}
</div>
