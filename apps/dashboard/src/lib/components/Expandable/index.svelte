<script lang="ts">
  import { page } from '$app/state';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import LinkIcon from '@lucide/svelte/icons/link';

  interface Props {
    id?: string;
    title?: string;
    titleClass?: string;
    disableContainerPadding?: boolean;
    rootClass?: string;
    supportsLink?: boolean;
    isExpanded?: boolean;
    children?: import('svelte').Snippet;
  }

  let {
    id = '',
    title = '',
    titleClass = '',
    disableContainerPadding = false,
    rootClass = '',
    supportsLink = false,
    isExpanded = $bindable(true),
    children
  }: Props = $props();

  function handleClick(e) {
    e.stopPropagation();

    isExpanded = !isExpanded;
  }
</script>

<div {id} class="w-full bg-white dark:bg-black {rootClass}">
  <button
    class="relative flex w-full items-center justify-between {!disableContainerPadding && 'p-5'}"
    tabindex="0"
    onclick={handleClick}
  >
    <p class="flex items-center dark:text-white {titleClass}">
      {title}
      {#if supportsLink}
        <a class="ml-2" href="{page.url.pathname}#{id}" onclick={(e) => e.stopPropagation()}>
          <LinkIcon size={16} />
        </a>
      {/if}
    </p>

    {#if isExpanded}
      <ChevronUpIcon size={16} />
    {:else}
      <ChevronDownIcon size={16} />
    {/if}
  </button>
  {#if isExpanded}
    <div class="flex flex-col p-5">
      {@render children?.()}
    </div>
  {/if}
</div>
