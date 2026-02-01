<script lang="ts">
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import { RoleBasedSecurity } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    isEditing?: boolean;
    disabled?: boolean;
    lockLabel?: string;
    showLock?: boolean;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onToggleLock: () => void;
  }

  let {
    isEditing = false,
    disabled = false,
    lockLabel = '',
    showLock = true,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onToggleLock
  }: Props = $props();
</script>

<RoleBasedSecurity allowedRoles={[1, 2]}>
  <div class="flex items-center gap-1">
    {#if isEditing}
      <Button variant="outline" onclick={onCancel}>
        {$t('course.navItem.lessons.add_lesson.cancel')}
      </Button>
      <Button onclick={onSave}>{$t('course.navItem.lessons.add_lesson.save')}</Button>
    {:else}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="ghost" size="icon" class="h-8 w-8" {disabled}>
            <EllipsisVerticalIcon class="h-5 w-5" />
            <span class="sr-only">Open menu</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          {#if showLock}
            <DropdownMenu.Item onclick={onToggleLock} {disabled}>
              {lockLabel}
            </DropdownMenu.Item>
          {/if}
          <DropdownMenu.Item onclick={onEdit} {disabled}>
            {$t('course.navItem.lessons.add_lesson.edit')}
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item class="text-red-600 focus:text-red-600 dark:text-red-400" onclick={onDelete} {disabled}>
            {$t('course.navItem.lessons.add_lesson.delete')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>
</RoleBasedSecurity>
