<script>
  import { LoaderCircle } from '@lucide/svelte';

  export let label = '';
  export let className = '';
  export let isLoading = false;
  export let isDisabled = false;
  export let onClick = () => {};
</script>

<div class="flex w-full items-center justify-center pt-5">
  <button class="bg-[#0233BD] py-4 text-sm font-medium text-white {className}" disabled={isDisabled} on:click={onClick}>
    {#if isLoading}
      <LoaderCircle size={24} class="animate-spin" />
    {:else}
      {label}
    {/if}
  </button>
</div>
