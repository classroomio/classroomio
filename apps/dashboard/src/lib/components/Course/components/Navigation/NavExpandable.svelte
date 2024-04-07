<script>
  import { slide } from 'svelte/transition';
  import ChevronDownIcon from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUpIcon from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import Add from 'carbon-icons-svelte/lib/Add.svelte';
  import { SkeletonText } from 'carbon-components-svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import FlashFilled from 'carbon-icons-svelte/lib/FlashFilled.svelte';
  import { handleAddLessonWidget } from './store';
  import NavIcons from './NavIcons.svelte';
  import { isFreePlan } from '$lib/utils/store/org';

  export let handleClick = () => {};
  export let label = '';
  export let isGroupActive = false;
  export let isExpanded = true;
  export let total = 0;
  export let isLoading = true;
  export let isLesson = false;
  export let isStudent = true;
  export let isPaidFeature = false;
  // export let subMenuItems = [];

  function addLesson() {
    $handleAddLessonWidget.open = true;
  }

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

    {#if isPaidFeature && $isFreePlan}
      <FlashFilled size={20} class="text-blue-700" />
    {/if}
    {#if isLesson && !isLoading}
      {#if !isStudent}
        <IconButton onClick={() => addLesson()} size="small">
          <Add />
        </IconButton>
      {/if}
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
