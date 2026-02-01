<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { InputField } from '@cio/ui/custom/input-field';
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { ContentType } from '@cio/utils/constants/content';
  import type { CourseContentItem } from '$features/course/utils/types';

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
    linkClass?: string;
    inputClass?: string;
    titleClass?: string;
    autoFocus?: boolean;
    preloadOff?: boolean;
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
    iconSize = 16,
    containerClass = '',
    linkClass = '',
    inputClass = '',
    titleClass = '',
    autoFocus = false,
    preloadOff = false
  }: Props = $props();
</script>

{#if isEditing}
  <InputField className={inputClass} bind:value={title} errorMessage={errors?.title} {autoFocus} />
{:else}
  <div class={containerClass}>
    {#if showIcon}
      {#if item.type === ContentType.Lesson}
        <LessonIcon size={iconSize} />
      {:else}
        <ExerciseIcon size={iconSize} />
      {/if}
    {/if}

    <a {href} class={linkClass} data-sveltekit-preload-data={preloadOff ? 'off' : undefined}>
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
  </div>
{/if}
