<script>
  import CaretSortDown20 from "carbon-icons-svelte/lib/CaretSortDown20";

  let isExpanded = true;
  export let handleClick = () => {};
  export let label = "";
  export let hideSortIcon = false;
  export let isGroupActive = false;
  // export let subMenuItems = [];

  function onClick() {
    isExpanded = !isExpanded;
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
      <CaretSortDown20
        class="carbon-icon-sort {isExpanded ? '' : 'carbon-icon-minimize'}"
      />
    {/if}
    <span class="pl-6 py-2 font-bold">{label}</span>
  </div>
  {#if isExpanded}
    <div class="flex flex-col">
      <!-- {#each subMenuItems as item}
        <a class="item {item.isActive && 'active'} pl-6 py-2" href={item.link}>
          # <span>{item.title}</span>
        </a>
      {/each} -->
      <slot />
    </div>
  {/if}
</div>

<style>
  :global(svg.carbon-icon-sort) {
    position: absolute;
    top: 3px;
    left: 0;
  }
  :global(svg.carbon-icon-minimize) {
    transform: rotate(270deg);
    top: 10px;
    left: -6px;
  }

  .active {
    background-color: #cae2f9;
    border-left: 3px solid var(--main-primary-color);
  }

  .active span {
    padding-left: 1.3rem;
  }

  .item:hover {
    background-color: #cae2f9;
  }
</style>
