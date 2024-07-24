<script lang="ts">
  import { slide } from 'svelte/transition';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import SidebarIcons from './SideBarIcons.svelte';

  export let label: string = '';
  export let id: string;
  export let href: string | null = '';
  export let isGroupActive: boolean = false;
  export let isExpanded: boolean | undefined;
  export let isDropdown: boolean = false;
  export let handleClick = () => {};

  function handleIsExpanded() {
    if (isDropdown) {
      isExpanded = !isExpanded;
    } else {
      handleClick();
    }
  }
</script>

<div class="">
  <a
    on:click={handleIsExpanded}
    class="item relative my-1 flex items-center gap-2.5 px-2.5 py-2 cursor-pointer {NavClasses.item} {isGroupActive &&
      NavClasses.active} w-[95%]"
    {href}
  >
    <SidebarIcons iconId={id} />

    <span class="text-sm font-medium">{label}</span>

    <span class="grow" />

    {#if isDropdown}
      <IconButton size="small">
        {#if isExpanded}
          <ChevronUpIcon class="carbon-icon dark:text-white" />
        {:else}
          <ChevronDownIcon class="carbon-icon dark:text-white" />
        {/if}
      </IconButton>
    {/if}
  </a>
  {#if isExpanded}
    <div in:slide out:slide class="flex flex-col items-center gap-1 w-[95%]">
      <slot />
    </div>
  {/if}
</div>
