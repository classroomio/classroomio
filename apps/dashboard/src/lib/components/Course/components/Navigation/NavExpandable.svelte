<script lang="ts">
  import { slide } from 'svelte/transition';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { SkeletonText } from 'carbon-components-svelte';
  import { IconButton } from '$lib/components/IconButton';
  import { NavClasses } from '$lib/utils/constants/reusableClass';
  import { handleAddLessonWidget } from '../Lesson/store';
  import NavIcons from './NavIcons.svelte';
  import { isFreePlan } from '$lib/utils/store/org';
  import { goto } from '$app/navigation';
  import { course } from '$lib/components/Course/store';
  import { COURSE_VERSION } from '$lib/utils/types';

  interface Props {
    handleClick?: any;
    id?: string;
    name?: string;
    label?: string;
    isGroupActive?: boolean;
    isExpanded: boolean | undefined;
    total?: number;
    isLoading?: boolean;
    isLesson?: boolean;
    isSection?: boolean;
    isStudent?: boolean;
    isPaidFeature?: boolean;
    className?: string;
    btnPadding?: string;
    children?: import('svelte').Snippet;
  }

  let {
    handleClick = () => {},
    id = '',
    name = '',
    label = '',
    isGroupActive = false,
    isExpanded = $bindable(),
    total = 0,
    isLoading = true,
    isLesson = false,
    isSection = false,
    isStudent = true,
    isPaidFeature = false,
    className = '',
    btnPadding = 'py-3 px-4',
    children
  }: Props = $props();

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
    onclick={onClick}
    disabled={isLoading}
  >
    <NavIcons {name} />
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
    <span class="grow"></span>

    {#if isPaidFeature && $isFreePlan}
      <ZapIcon class="filled" />
    {/if}
    {#if (isLesson || isSection) && !isLoading && !isStudent}
      <IconButton stopPropagation={true} onClick={addLesson} size="small">
        <PlusIcon />
      </IconButton>
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
      {@render children?.()}
    </div>
  {/if}
</div>
