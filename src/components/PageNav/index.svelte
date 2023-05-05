<script>
  import NewButton from '../PrimaryContainedButton/index.svelte';
  import TextField from '../Form/TextField.svelte';
  import Chip from '../Chip/index.svelte';
  export let title = '';
  export let overidableStyle = '';
  export let navItems = [];
  export let addButtonHref = '';
  export let addButtonLabel = '';
  export let disableSticky = false;
  export let isTitleEditable = false;
  export let onEditComplete = () => {};
  export let paddingClass = 'px-2';

  let dynamicRootClass = '';
  let enterEditTitleMode = false;

  $: dynamicRootClass =
    Array.isArray(navItems) && navItems.length > 4 ? 'bring-down' : '';
</script>

<div
  class="header dark:bg-gray-700 flex items-center justify-between {!disableSticky &&
    'sticky'} {paddingClass} {dynamicRootClass}"
  style={overidableStyle}
>
  {#if !!title}
    {#if isTitleEditable}
      {#if !enterEditTitleMode}
        <h4
          class="title editable-title hover:bg-gray-100 dark:bg-gray-700 px-3 rounded-md overflow-ellipsis"
          on:click={() => (enterEditTitleMode = true)}
        >
          {title}
        </h4>
      {:else}
        <TextField
          bind:value={title}
          placeholder="Course title"
          onChange={() => {
            enterEditTitleMode = false;

            if (typeof onEditComplete === 'function') {
              onEditComplete();
            }
          }}
        />
      {/if}
    {:else}
      <div class="flex items-center" {title}>
        <slot name="image" />
        <h4 class="dark:text-white title">{title}</h4>
      </div>
    {/if}
  {/if}
  {#if Array.isArray(navItems) && navItems.length}
    <div class="flex justify-evenly items-center">
      {#each navItems as item}
        <a
          class="mr-5 text-sm flex items-center {item.isActive && 'active'}"
          href={item.href}
        >
          {item.label}

          {#if typeof item.badgeValue === 'number'}
            <Chip value={item.badgeValue} className="ml-1 bg-gray-300" />
          {/if}
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
    min-height: 61px;
    z-index: 1;
  }

  .header.sticky {
    position: sticky;
    top: 0;
  }

  .title {
    font-size: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 250px;
    margin-left: 5px;
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
    content: '';
    width: 100%;
    height: 3px;
    background-color: var(--main-primary-color);
    display: block;
    bottom: -8px;
  }

  .header.bring-down {
    flex-direction: column;
    align-items: flex-start;
  }
  .spacing {
    flex-grow: 1;
  }

  .editable-title {
    font-size: 16px;
    display: flex;
    /* justify-content: center; */
    align-items: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 10px;
  }

  @media (max-width: 760px) {
    .title {
      width: fit-content;
    }
  }
</style>
