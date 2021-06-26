<script>
  import NewButton from "../PrimaryContainedButton/index.svelte";
  export let title = "";
  export let overidableStyle = "";
  export let navItems = [];
  export let addButtonHref;
  export let addButtonLabel;
  export let disableSticky = false;
  let dynamicRootClass = "";

  $: dynamicRootClass =
    Array.isArray(navItems) && navItems.length > 4 ? "bring-down" : "";
</script>

<div
  class="header flex items-center justify-between {!disableSticky &&
    'sticky'} {dynamicRootClass}"
  style={overidableStyle}
>
  {#if !!title}
    <h4 class="title">{title}</h4>
  {/if}
  {#if Array.isArray(navItems) && navItems.length}
    <div class="flex justify-evenly items-center">
      {#each navItems as item}
        <a class="mr-5 text-sm {item.isActive && 'active'}" href={item.href}>
          {item.label}
        </a>
      {/each}
      {#if addButtonHref}
        <NewButton href={addButtonHref} label={addButtonLabel} />
      {/if}
    </div>
  {/if}
  <slot name="widget" />
</div>

<style>
  .header {
    border-bottom: 1px solid var(--border-color);
    padding: 15px;
    min-height: 61px;
    background-color: #fff;
    z-index: 1;
  }

  .header.sticky {
    position: sticky;
    top: 0;
  }

  .title {
    font-size: 20px;
  }

  h4 {
    font-size: 16px;
    font-weight: 900;
    word-break: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .active {
    position: relative;
    display: inline-block;
  }

  .active::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 3px;
    background-color: var(--main-primary-color);
    display: block;
  }

  .header.bring-down {
    flex-direction: column;
    align-items: flex-start;
  }
  .spacing {
    flex-grow: 1;
  }

  @media only screen and (max-width: 1002px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
