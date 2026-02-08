<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RoleBasedSecurity } from '$features/ui';
  import type { CourseContent } from '$features/course/utils/types';
  import ContentActions from './content-actions.svelte';

  type ContentSection = CourseContent['sections'][number];

  interface Props {
    section: ContentSection;
    isEditing?: boolean;
    disabled?: boolean;
    showActions?: boolean;
    errors?: Record<string, string>;
    lockLabel?: string;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onAddContent: () => void;
    onToggleLock?: () => void;
    onDelete: () => void;
  }

  let {
    section,
    isEditing = false,
    disabled = false,
    showActions = true,
    errors = {},
    lockLabel,
    onEdit,
    onSave,
    onCancel,
    onAddContent,
    onToggleLock,
    onDelete
  }: Props = $props();
</script>

<div
  class="ui:bg-secondary flex min-h-[50px] items-center justify-between rounded-tl-md rounded-tr-md border-b px-3 py-1 dark:bg-neutral-700"
>
  {#if isEditing}
    <div class="flex w-4/6 items-center gap-2">
      <TableOfContentsIcon size={16} class="shrink-0" />
      <InputField className="flex-1" bind:value={section.title} errorMessage={errors?.title} />
    </div>
  {:else}
    <div class="flex w-4/6 items-center gap-2">
      <TableOfContentsIcon size={16} class="shrink-0" />
      <p class="font-semibold">{section.title}</p>
    </div>
  {/if}

  {#if showActions}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex items-center gap-1">
        {#if !isEditing}
          <IconButton variant="outline" onclick={onAddContent} {disabled}>
            <PlusIcon size={16} />
          </IconButton>
        {/if}

        <ContentActions
          {disabled}
          {isEditing}
          lockLabel={lockLabel || ''}
          showLock={Boolean(lockLabel && onToggleLock)}
          {onEdit}
          {onSave}
          {onCancel}
          {onDelete}
          onToggleLock={() => onToggleLock?.()}
        />
      </div>
    </RoleBasedSecurity>
  {/if}
</div>
