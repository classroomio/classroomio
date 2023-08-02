<script>
  import CaretSortDownIcon from 'carbon-icons-svelte/lib/CaretSortDown.svelte';

  let isExpanded = true;
  export let handleClick = () => {};
  export let label = '';
  export let hideSortIcon = false;
  export let isGroupActive = false;
  // export let subMenuItems = [];

  function onClick() {
    // isExpanded = !isExpanded;
    handleClick();
  }
</script>

<div>
  <div
    class="item relative flex items-center {isGroupActive && 'active'}"
    role="button"
    tabindex="0"
    on:click={onClick}
  >
    {#if !hideSortIcon}
      <CaretSortDownIcon
        size={20}
        class="carbon-icon-sort {isExpanded ? '' : 'carbon-icon-minimize'}"
      />
    {/if}
    <span class="dark:text-white font-bold">{label}</span>
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
    top: 8px;
    left: 0;
  }
  :global(svg.carbon-icon-minimize) {
    transform: rotate(270deg);
    top: 13px;
    left: -6px;
  }

  .active {
    background-color: #cae2f9;
    border-left: 3px solid var(--main-primary-color);
  }

  :global(body.dark) .active,
  :global(body.dark) .item:hover {
    background-color: rgba(107, 114, 128);
  }

  .active span {
    padding-left: 1.3rem;
  }

  .item span {
    padding: 12px 24px;
  }

  .item:hover {
    background-color: #cae2f9;
  }
</style>
