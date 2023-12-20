<script>
  import { slide } from 'svelte/transition';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import NavIcons from './NavIcons.svelte';
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';

  export let handleClick = () => {};
  export let label = '';
  export let isGroupActive = false;
  export let isExpanded = true;
  export let total = 0;
  export let isLoading = true;
  // export let subMenuItems = [];

  function onClick() {
    handleClick();
  }

  function toggleIsExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<div class="">
  <button
    class="item relative flex items-center py-3 px-4 ml-2 mb-1 {NavClasses.item} {isGroupActive &&
      !isLoading &&
      NavClasses.active} w-[95%]"
    tabindex="0"
    on:click={onClick}
    disabled={isLoading}
  >
    <NavIcons name={label} />
    {#if isLoading}
      <div class="w-11/12 mx-auto">
        <SkeletonText class="rounded-md" style="margin: 0px; height: 30px;" />
      </div>
    {:else}
      <span class="font-bold text-md">{label}</span>
      {#if total}
        <span class="ml-1">({total})</span>
      {/if}
    {/if}
    <span class="grow" />

    {#if label === 'Lessons' && !isLoading}
      <IconButton size="small" stopPropagation={true} onClick={toggleIsExpanded}>
        {#if isExpanded}
          <ChevronUpIcon class="carbon-icon dark:text-white" />
        {:else}
          <ChevronDownIcon class="carbon-icon dark:text-white" />
        {/if}
      </IconButton>
    {/if}
  </button>
  {#if isExpanded && !isLoading}
    <div in:slide out:slide class="flex flex-col">
      <slot />
    </div>
  {/if}
</div>
