<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import Chip from '../Chip/index.svelte';
  import TextField from '../Form/TextField.svelte';

  interface Props {
    title?: string;
    overidableStyle?: string;
    navItems?: any;
    disableSticky?: boolean;
    isTitleEditable?: boolean;
    onEditComplete?: any;
    paddingClass?: string;
    hideOnMobile?: boolean;
    image?: import('svelte').Snippet;
    widget?: import('svelte').Snippet;
  }

  let {
    title = $bindable(''),
    overidableStyle = '',
    navItems = [],
    disableSticky = false,
    isTitleEditable = false,
    onEditComplete = () => {},
    paddingClass = 'px-2',
    hideOnMobile = false,
    image,
    widget
  }: Props = $props();

  let enterEditTitleMode = $state(false);

  const dynamicRootClass = $derived(Array.isArray(navItems) && navItems.length > 4 ? 'bring-down' : '');
</script>

<div
  class="{hideOnMobile &&
    'hideOnMobile'} header border-b border-gray-200 bg-white dark:border-neutral-600 dark:bg-black {!disableSticky &&
    'sticky'} {dynamicRootClass}"
  style={overidableStyle}
>
  <div
    class="{hideOnMobile
      ? 'hidden lg:flex'
      : ''} {paddingClass} m-auto flex min-h-[61px] max-w-4xl items-center justify-between"
  >
    {#if !!title}
      {#if isTitleEditable}
        {#if !enterEditTitleMode}
          <button class="w-full" onclick={() => (enterEditTitleMode = true)}>
            <h4 class="editable-title overflow-ellipsis rounded-md px-3 hover:bg-gray-100 dark:bg-black">
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
        <div class="flex w-full items-center" {title}>
          {@render image?.()}
          <h4 class="{image ? 'ml-2' : ''} truncate whitespace-nowrap text-lg font-semibold dark:text-white">
            {title}
          </h4>
        </div>
      {/if}
    {/if}
    {#if Array.isArray(navItems) && navItems.length}
      <div class="flex items-center justify-evenly">
        {#each navItems as item}
          <a
            class="relative mr-5 flex items-center pb-2 text-sm {item.isActive
              ? 'text-primary-700'
              : 'text-black dark:text-white'} hover:no-underline"
            href={item.href}
          >
            {item.label}

            {#if typeof item.badgeValue === 'number'}
              <Chip value={item.badgeValue} className="ml-1 bg-gray-300 dark:text-black" />
            {/if}
            <span
              class="bg-primary-700 absolute bottom-0 left-0 h-1 transition-all duration-500 ease-in-out {item.isActive
                ? 'w-full'
                : 'w-0'}"
            ></span>
          </a>
        {/each}
      </div>
    {/if}
    {@render widget?.()}
  </div>
</div>

<style>
  .header {
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
