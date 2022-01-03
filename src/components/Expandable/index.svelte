<script>
  import { stores } from '@sapper/app';
  import ChevronDown24 from 'carbon-icons-svelte/lib/ChevronDown24';
  import ChevronUp24 from 'carbon-icons-svelte/lib/ChevronUp24';
  import Link24 from 'carbon-icons-svelte/lib/Link24';

  export let id = '';
  export let title = '';
  export let titleClass = '';
  export let disableContainerPadding = false;
  export let rootClass = '';
  export let supportsLink = false;

  export let isExpanded = true;

  const { page } = stores();

  function handleClick(e) {
    e.stopPropagation();

    isExpanded = !isExpanded;
  }
</script>

<div {id} class="w-full bg-white {rootClass}">
  <div
    class="w-full relative flex items-center justify-between {!disableContainerPadding &&
      'p-5'}"
    role="button"
    tabindex="0"
    on:click={handleClick}
  >
    <p class="font-bold flex items-center {titleClass}">
      {title}
      {#if supportsLink}
        <a
          class="ml-2"
          href="{$page.path}#{id}"
          on:click={(e) => e.stopPropagation()}
        >
          <Link24 class="carbon-icon" />
        </a>
      {/if}
    </p>

    {#if isExpanded}
      <ChevronUp24 class="carbon-icon" />
    {:else}
      <ChevronDown24 class="carbon-icon" />
    {/if}
  </div>
  {#if isExpanded}
    <div class="flex flex-col p-5">
      <slot />
    </div>
  {/if}
</div>
