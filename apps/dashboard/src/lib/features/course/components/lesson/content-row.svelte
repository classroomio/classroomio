<script lang="ts">
  import { resolve } from '$app/paths';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { InputField } from '@cio/ui/custom/input-field';
  import { CircleCheckIcon } from '$features/ui/icons';
  import type { Snippet } from 'svelte';
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { cn } from '@cio/ui/tools';

  interface Props {
    item: CourseContentItem;
    title: string | null | undefined;
    href: string;
    isEditing?: boolean;
    errors?: Record<string, string>;
    isLocked?: boolean;
    isComplete?: boolean | null;
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
    isEditing = false,
    errors = {},
    isLocked = false,
    isComplete = null,
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
</script>

{#if isEditing}
  <InputField className={cn('w-4/6', inputClass)} bind:value={title} errorMessage={errors?.title} {autoFocus} />
{:else}
  <div class={cn('w-4/5', containerClass)}>
    <div class={cn('flex items-center gap-2', rowClass)}>
      {#if showIcon}
        <CourseContentIcon type={item.type} size={iconSize} />
      {/if}

      <a
        href={resolve(href, {})}
        class={cn(
          'flex-1 truncate text-sm text-black hover:underline dark:text-white',
          isLocked ? 'cursor-not-allowed opacity-50' : linkClass
        )}
        data-sveltekit-preload-data={preloadOff ? 'off' : undefined}
      >
        <span class={titleClass}>{title}</span>
      </a>

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
