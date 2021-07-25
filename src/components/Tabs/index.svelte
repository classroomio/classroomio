<script>
  export let tabs = [];
  export let currentTab;
  export let onChange;
</script>

<div class="w-full flex justify-center flex-col">
  <div class="flex items-center">
    {#each tabs as tab}
      <button
        class="relative border-r-1 border-t-0 border-b-0 border-l-0 rounded-none {currentTab ===
        tab.value
          ? 'text-black font-bold bg-gray-100'
          : 'bg-gray-200 text-gray'} focus:outline-none w-40 text-left p-3"
        on:click={onChange(tab.value)}
      >
        {tab.label}

        {#if currentTab === tab.value}
          <span class="absolute w-full top-0 left-0 h-1 bg-blue-500" />
        {/if}
      </button>
    {/each}
  </div>

  <div class="mt-4">
    <slot name="content" />
  </div>
</div>
