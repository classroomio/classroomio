<script>
  import CaretSortDown20 from "carbon-icons-svelte/lib/CaretSortDown20";

  let isExpanded = true;
  export let handleClick = () => {};
  export let label = "";

  function onClick() {
    isExpanded = !isExpanded;
    handleClick();
  }
</script>

<div>
  <div
    class="relative flex items-center"
    role="button"
    tabindex="0"
    on:click={onClick}
  >
    <CaretSortDown20
      class="carbon-icon-sort {isExpanded ? '' : 'carbon-icon-minimize'}"
    />
    <span class="ml-6 mb-2 {isExpanded ? 'font-bold' : ''}">{label}</span>
  </div>
  {#if isExpanded}
    <div class="flex flex-col">
      <slot />
    </div>
  {/if}
</div>

<style>
  :global(svg.carbon-icon-sort) {
    position: absolute;
    top: -5px;
    left: 0;
  }
  :global(svg.carbon-icon-minimize) {
    transform: rotate(270deg);
    top: 2px;
    left: -6px;
  }
</style>
