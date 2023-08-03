<script>
  import CaretSortDownIcon from 'carbon-icons-svelte/lib/CaretSortDown.svelte';

  export let handleClick = () => {};
  export let label = '';
  export let isGroupActive = false;
  // export let subMenuItems = [];

  let isExpanded = true;
  let activeClass = 'bg-gray-200 dark:bg-gray-700';

  function onClick() {
    // isExpanded = !isExpanded;
    handleClick();
  }
</script>

<div class="">
  <button
    class="item relative flex items-center py-3 px-4 ml-2 mb-1 rounded hover:bg-gray-200 dark:hover:bg-gray-500 {isGroupActive &&
      activeClass} w-[95%]"
    tabindex="0"
    on:click={onClick}
  >
    <span class="dark:text-white font-bold">{label}</span>
  </button>
  {#if isExpanded}
    <div class="flex flex-col">
      <slot />
    </div>
  {/if}
</div>
