<script>
  export let tabs = [];

  export let selectedTab;
</script>

<div class="mb-3">
  {#each tabs as tab}
    <button
      class="mr-3 pb-2 border-t-0 border-l-0 border-r-0 {selectedTab ===
      tab.value
        ? 'border-b-4 border-indigo-600 focus:border-indigo-600'
        : 'border-b-0'}"
      on:click={() => (selectedTab = tab.value)}
    >
      {tab.label}
    </button>
  {/each}
</div>
