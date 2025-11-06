<script lang="ts">
  import { goto } from '$app/navigation';
  import { slide } from 'svelte/transition';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  import { COURSE_VERSION } from '$lib/utils/types';
  import { isFreePlan } from '$lib/utils/store/org';
  import { course } from '$lib/components/Course/store';
  import { handleAddLessonWidget } from '../Lesson/store';
  import { NavClasses } from '$lib/utils/constants/reusableClass';

  import NavIcons from './NavIcons.svelte';
  import { IconButton } from '$lib/components/IconButton';

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
    class="item group relative flex items-center {btnPadding} mb-1 ml-2 {NavClasses.item} {isGroupActive &&
      !isLoading &&
      NavClasses.active} w-[95%]"
    tabindex="0"
    onclick={onClick}
    disabled={isLoading}
  >
    <div class="flex w-full items-center gap-2.5">
      <NavIcons {name} />
      {#if isLoading}
        <div class="mx-auto w-11/12">
          <Skeleton class="h-5 w-full rounded-md" />
        </div>
      {:else}
        <span class="text-md line-clamp-2 text-start font-bold leading-4">{label}</span>
        {#if total}
          <span class="ml-1">({total})</span>
        {/if}
      {/if}
    </div>
    <span class="grow"></span>

    {#if isPaidFeature && $isFreePlan}
      <ZapIcon size={16} class="filled" />
    {/if}
    {#if (isLesson || isSection) && !isLoading && !isStudent}
      <IconButton stopPropagation={true} onClick={addLesson} size="small">
        <PlusIcon size={16} />
      </IconButton>
      <IconButton size="small" stopPropagation={true} onClick={toggleIsExpanded}>
        {#if isExpanded}
          <ChevronUpIcon size={16} class="carbon-icon dark:text-white" />
        {:else}
          <ChevronDownIcon size={16} class="carbon-icon dark:text-white" />
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
