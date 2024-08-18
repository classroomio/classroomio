<script>
  export let label = '';
  export let className = '';
  export let isLoading = false;
  export let isDisabled = false;
  export let onClick = () => {};
</script>

<div class="w-full flex items-center justify-center pt-5">
  <button
    class="bg-[#0233BD] text-white font-medium text-sm py-4 {className}"
    disabled={isDisabled}
    on:click={onClick}
  >
    {#if isLoading}
      loading...
    {:else}
      {label}
    {/if}
  </button>
</div>
