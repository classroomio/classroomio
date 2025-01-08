<script lang="ts">
  import IconButton from '$lib/components/IconButton/index.svelte';
  import SideBarIcons from '$lib/components/Org/SidebarIcons.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import { slide } from 'svelte/transition';

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

<div>
  <a
    on:click={handleIsExpanded}
    class="item relative my-1 flex cursor-pointer items-center gap-2.5 px-2.5 py-2 {NavClasses.item} {isGroupActive &&
      NavClasses.active} w-[95%]"
    {href}
  >
    <SideBarIcons iconId={id} />

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
    <div in:slide out:slide class="flex w-[95%] flex-col items-center gap-1">
      <slot />
    </div>
  {/if}
</div>
