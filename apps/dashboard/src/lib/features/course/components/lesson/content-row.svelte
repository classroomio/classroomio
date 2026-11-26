<script lang="ts">
  import { resolve } from '$app/paths';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { InputField } from '@cio/ui/custom/input-field';
  import { CircleCheckIcon } from '$features/ui/icons';
  import type { Snippet } from 'svelte';
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { ContentType } from '@cio/utils/constants/content';
  import { cn } from '@cio/ui/tools';
  import { getSessionIndicatorPhase, liveSessionClock } from '$features/course/utils/live-session-phase';
  import LiveSessionIndicator from './live-session-indicator.svelte';
  import RequirementMarker from './requirement-marker.svelte';

  interface Props {
    item: CourseContentItem;
    title: string | null | undefined;
    href: string;
    linkDisabled?: boolean;
    isEditing?: boolean;
    errors?: Record<string, string>;
    isLocked?: boolean;
    isComplete?: boolean | null;
    required?: boolean;
    showStatus?: boolean;
    showIcon?: boolean;
    iconSize?: number;
    containerClass?: string;
    rowClass?: string;
    linkClass?: string;
    inputClass?: string;
    titleClass?: string;
    autoFocus?: boolean;
    preloadOff?: boolean;
    inline?: Snippet;
    meta?: Snippet;
  }

  let {
    item,
    title = $bindable(),
    href,
    linkDisabled = false,
    isEditing = false,
    errors = {},
    isLocked = false,
    isComplete = null,
    required = false,
    showStatus = false,
    showIcon = true,
    iconSize = 14,
    containerClass = '',
    rowClass = '',
    linkClass = '',
    inputClass = '',
    titleClass = '',
    autoFocus = false,
    preloadOff = false,
    inline,
    meta
  }: Props = $props();

  const sessionPhase = $derived(
    item.type === ContentType.Lesson ? getSessionIndicatorPhase(item, $liveSessionClock) : null
  );
</script>

{#if isEditing}
  <InputField
    className={cn('w-4/6', inputClass)}
    bind:value={title}
    errorMessage={errors?.title}
    onInput={() => {
      if (errors) delete errors.title;
    }}
    {autoFocus}
  />
{:else}
  <div class={cn('w-4/5', containerClass)}>
    <div class={cn('flex items-center gap-2', rowClass)}>
      {#if showIcon}
        <CourseContentIcon type={item.type} size={iconSize} />
      {/if}

      {#if sessionPhase}
        <LiveSessionIndicator phase={sessionPhase} size={iconSize} />
      {/if}

      <svelte:element
        this={linkDisabled ? 'span' : 'a'}
        href={linkDisabled ? undefined : resolve(href, {})}
        class={cn(
          'group/title flex min-w-0 flex-1 items-center gap-0.5 text-sm text-black dark:text-white',
          isLocked ? 'cursor-not-allowed opacity-50' : linkClass
        )}
        data-sveltekit-preload-data={preloadOff && !linkDisabled ? 'off' : undefined}
      >
        <span class={cn('truncate', !linkDisabled && 'group-hover/title:underline', titleClass)}>{title}</span>
        {#if required}
          <RequirementMarker />
        {/if}
      </svelte:element>

      {#if showStatus}
        {#if isLocked}
          <LockIcon size={iconSize} class="shrink-0" />
        {:else if isComplete}
          <span class="shrink-0">
            <CircleCheckIcon size={iconSize} filled />
          </span>
        {/if}
      {/if}

      {@render inline?.()}
    </div>
    {@render meta?.()}
  </div>
{/if}
