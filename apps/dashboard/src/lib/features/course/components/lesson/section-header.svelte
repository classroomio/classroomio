<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import TableOfContentsIcon from '@lucide/svelte/icons/table-of-contents';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseContent } from '$features/course/utils/types';

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
  class="mb-2 flex min-h-[50px] items-center justify-between rounded-tl-md rounded-tr-md border-b bg-gray-50 px-3 py-1 dark:bg-neutral-700"
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
      <div class="flex items-center">
        {#if isEditing}
          <Button variant="outline" onclick={onCancel}>
            {$t('course.navItem.lessons.add_lesson.cancel')}
          </Button>
          <Button onclick={onSave}>{$t('course.navItem.lessons.add_lesson.save')}</Button>
        {:else}
          <IconButton onclick={onAddContent} {disabled}>
            <PlusIcon size={16} />
          </IconButton>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="icon" class="h-8 w-8" {disabled}>
                <EllipsisVerticalIcon class="h-5 w-5" />
                <span class="sr-only">Open menu</span>
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item onclick={onEdit} {disabled}>
                {$t('course.navItem.lessons.add_lesson.edit')}
              </DropdownMenu.Item>
              {#if lockLabel && onToggleLock}
                <DropdownMenu.Item onclick={onToggleLock} {disabled}>
                  {lockLabel}
                </DropdownMenu.Item>
              {/if}
              <DropdownMenu.Separator />
              <DropdownMenu.Item
                class="text-red-600 focus:text-red-600 dark:text-red-400"
                onclick={onDelete}
                {disabled}
              >
                {$t('course.navItem.lessons.add_lesson.delete')}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    </RoleBasedSecurity>
  {/if}
</div>
