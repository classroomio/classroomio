<script>
  import { page } from '$app/stores';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import LinkIcon from 'carbon-icons-svelte/lib/Link.svelte';

  export let id = '';
  export let title = '';
  export let titleClass = '';
  export let disableContainerPadding = false;
  export let rootClass = '';
  export let supportsLink = false;

  export let isExpanded = true;

  function handleClick(e) {
    e.stopPropagation();

    isExpanded = !isExpanded;
  }
</script>

<div {id} class="w-full bg-white dark:bg-gray-800 {rootClass}">
  <button
    class="w-full relative flex items-center justify-between {!disableContainerPadding && 'p-5'}"
    tabindex="0"
    on:click={handleClick}
  >
    <p class="dark:text-white font-bold flex items-center {titleClass}">
      {title}
      {#if supportsLink}
        <a class="ml-2" href="{$page.url.pathname}#{id}" on:click={(e) => e.stopPropagation()}>
          <LinkIcon size={24} class="carbon-icon dark:text-white" />
        </a>
      {/if}
    </p>

    {#if isExpanded}
      <ChevronUpIcon size={24} class="carbon-icon dark:text-white" />
    {:else}
      <ChevronDownIcon size={24} class="carbon-icon dark:text-white" />
    {/if}
  </button>
  {#if isExpanded}
    <div class="flex flex-col p-5">
      <slot />
    </div>
  {/if}
</div>
