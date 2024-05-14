<script>
  import NewButton from '../PrimaryContainedButton/index.svelte';
  import TextField from '../Form/TextField.svelte';
  import Chip from '../Chip/index.svelte';
  import { t } from '$lib/utils/functions/translations';

  export let title = '';
  export let overidableStyle = '';
  export let navItems = [];
  export let addButtonHref = '';
  export let addButtonLabel = '';
  export let disableSticky = false;
  export let isTitleEditable = false;
  export let onEditComplete = () => {};
  export let paddingClass = 'px-2';
  export let hideOnMobile = false;

  let dynamicRootClass = '';
  let enterEditTitleMode = false;

  $: dynamicRootClass = Array.isArray(navItems) && navItems.length > 4 ? 'bring-down' : '';
</script>

<div
  class="{hideOnMobile &&
    'hideOnMobile'} header dark:bg-black dark:border-neutral-600 bg-white {!disableSticky &&
    'sticky'} {dynamicRootClass}"
  style={overidableStyle}
>
  <div
    class="{hideOnMobile
      ? 'hidden lg:flex'
      : ''} {paddingClass} max-w-4xl m-auto flex items-center justify-between min-h-[61px]"
  >
    {#if !!title}
      {#if isTitleEditable}
        {#if !enterEditTitleMode}
          <button class="w-full" on:click={() => (enterEditTitleMode = true)}>
            <h4
              class="editable-title hover:bg-gray-100 dark:bg-black px-3 rounded-md overflow-ellipsis"
            >
              {title}
            </h4>
          </button>
        {:else}
          <TextField
            bind:value={title}
            placeholder={$t('course.navItem.settings.course_title')}
            onChange={() => {
              enterEditTitleMode = false;

              if (typeof onEditComplete === 'function') {
                onEditComplete();
              }
            }}
          />
        {/if}
      {:else}
        <div class="flex items-center w-full" {title}>
          <slot name="image" />
          <h4
            class="{$$slots.image
              ? 'ml-2'
              : ''} dark:text-white whitespace-nowrap truncate text-lg font-semibold"
          >
            {title}
          </h4>
        </div>
      {/if}
    {/if}
    {#if Array.isArray(navItems) && navItems.length}
      <div class="flex justify-evenly items-center">
        {#each navItems as item}
          <a
            class="mr-5 pb-2 text-sm font-bold flex items-center relative {item.isActive
              ? 'text-primary-700'
              : 'dark:text-white text-black'} hover:no-underline"
            href={item.href}
          >
            {item.label}

            {#if typeof item.badgeValue === 'number'}
              <Chip value={item.badgeValue} className="ml-1 bg-gray-300 dark:text-black" />
            {/if}
            <span
              class="absolute bottom-0 left-0 h-1 bg-primary-700 transition-all ease-in-out duration-500 {item.isActive
                ? 'w-full'
                : 'w-0'}"
            />
          </a>
        {/each}
        {#if addButtonHref}
          <NewButton href={addButtonHref} label={addButtonLabel} />
        {/if}
      </div>
    {/if}
    <slot name="widget" />
  </div>
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

  .header.bring-down {
    flex-direction: column;
    align-items: flex-start;
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

  @media (max-width: 1024px) {
    .title {
      width: fit-content;
    }

    .hideOnMobile {
      display: none;
    }
  }
</style>
