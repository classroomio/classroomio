<script lang="ts">
  import { goto } from '$app/navigation';
  import { course } from '$lib/components/Course/store';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { isFreePlan } from '$lib/utils/store/org';
  import { COURSE_VERSION } from '$lib/utils/types';
  import { SkeletonText } from 'carbon-components-svelte';
  import { Add, ChevronDown, ChevronUp, FlashFilled } from 'carbon-icons-svelte';
  import { slide } from 'svelte/transition';
  import { handleAddLessonWidget } from '../Lesson/store';
  import NavIcons from './NavIcons.svelte';

  export let handleClick = () => {};
  export let id = '';
  export let label = '';
  export let isGroupActive = false;
  export let isExpanded: boolean | undefined;
  export let total = 0;
  export let isLoading = true;
  export let isLesson = false;
  export let isSection = false;
  export let isStudent = true;
  export let isPaidFeature = false;
  export let addIconClick: (() => void) | undefined = undefined;
  // export let subMenuItems = [];
  export let className = '';
  export let btnPadding = 'py-3 px-4';

  function addLesson() {
    goto('/courses/' + $course.id + '/lessons');
    $handleAddLessonWidget.open = true;

    if ($course.version === COURSE_VERSION.V2) {
      // If it is section, then add lesson to section
      $handleAddLessonWidget.isSection = isSection ? false : true;

      if (isSection) {
        $handleAddLessonWidget.id = id;
      }
    }
  }

  function onClick() {
    if (isSection) {
      toggleIsExpanded();
    }

    handleClick();
  }

  function toggleIsExpanded() {
    isExpanded = !isExpanded;
  }
</script>

<div class={className}>
  <button
    class="item relative flex items-center {btnPadding} mb-1 ml-2 {NavClasses.item} {isGroupActive &&
      !isLoading &&
      NavClasses.active} w-[95%]"
    tabindex="0"
    on:click={onClick}
    disabled={isLoading}
  >
    <NavIcons {id} />
    {#if isLoading}
      <div class="mx-auto w-11/12">
        <SkeletonText class="rounded-md" style="margin: 0px; height: 30px;" />
      </div>
    {:else}
      <span class="text-md line-clamp-2 text-start font-bold leading-4">{label}</span>
      {#if total}
        <span class="ml-1">({total})</span>
      {/if}
    {/if}
    <span class="grow" />

    {#if isPaidFeature && $isFreePlan}
      <FlashFilled size={20} class="text-blue-700" />
    {/if}

    {#if (isLesson || isSection) && !isLoading && !isStudent}
      <IconButton
        stopPropagation={true}
        onClick={addIconClick ? addIconClick : addLesson}
        size="small"
      >
        <Add />
      </IconButton>
      <IconButton size="small" stopPropagation={true} onClick={toggleIsExpanded}>
        {#if isExpanded}
          <ChevronUp class="carbon-icon dark:text-white" />
        {:else}
          <ChevronDown class="carbon-icon dark:text-white" />
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
