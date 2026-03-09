<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RoleBasedSecurity } from '$features/ui';
  import CourseContentIcon from '$features/course/components/course-content-icon.svelte';
  import type { CourseContent } from '$features/course/utils/types';
  import { ContentType } from '@cio/utils/constants/content';
  import ContentActions from './content-actions.svelte';
  import ContentCountBadges from '../content-count-badges.svelte';

  type ContentSection = CourseContent['sections'][number];

  const sectionCount = $derived.by(() => {
    const items = section.items ?? [];
    return {
      lessons: items.filter((item) => item.type === ContentType.Lesson).length,
      exercises: items.filter((item) => item.type === ContentType.Exercise).length
    };
  });

  interface Props {
    section: ContentSection;
    isEditing?: boolean;
    disabled?: boolean;
    isSaving?: boolean;
    showActions?: boolean;
    showAddContent?: boolean;
    showDelete?: boolean;
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
    isSaving = false,
    showActions = true,
    showAddContent = true,
    showDelete = true,
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
  class="ui:bg-secondary flex min-h-[50px] items-center justify-between rounded-tl-md rounded-tr-md border-b px-3 dark:bg-neutral-700"
>
  {#if isEditing}
    <div class="flex w-4/6 items-center gap-2">
      <CourseContentIcon type={ContentType.Section} size={16} />
      <InputField className="flex-1" bind:value={section.title} errorMessage={errors?.title} />
    </div>
  {:else}
    <div class="flex w-4/6 items-center gap-2">
      <CourseContentIcon type={ContentType.Section} size={16} />
      <p class="font-semibold">{section.title}</p>
      <ContentCountBadges lessons={sectionCount.lessons} exercises={sectionCount.exercises} />
    </div>
  {/if}

  {#if showActions}
    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <div class="flex items-center gap-1">
        {#if !isEditing && showAddContent}
          <IconButton variant="outline" onclick={onAddContent} {disabled}>
            <PlusIcon size={16} />
          </IconButton>
        {/if}

        <ContentActions
          {disabled}
          {isEditing}
          {isSaving}
          lockLabel={lockLabel || ''}
          showLock={Boolean(lockLabel && onToggleLock)}
          {showDelete}
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
