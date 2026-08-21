<script lang="ts">
  import type { Snippet } from 'svelte';
  import { UserAvatar } from '../user-avatar';
  import { Badge } from '../../base/badge';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  interface Props {
    avatarUrl?: string | null;
    fullname?: string | null;
    createdAt?: string | null;
    dateLabel?: string | null;
    roleBadge?: string | null;
    avatarSize?: string;
    canEdit?: boolean;
    onEdit?: () => void;
    canDelete?: boolean;
    onDelete?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    class?: string;
    actions?: Snippet;
  }

  let {
    avatarUrl,
    fullname = '',
    createdAt,
    dateLabel,
    roleBadge,
    avatarSize = 'ui:size-7',
    canEdit = false,
    onEdit,
    canDelete = false,
    onDelete,
    editLabel = 'Edit',
    deleteLabel = 'Delete',
    class: className = '',
    actions
  }: Props = $props();

  const displayDate = $derived(
    dateLabel || (createdAt && !isNaN(Date.parse(createdAt)) ? new Date(createdAt).toLocaleDateString() : '')
  );
  const hasActions = $derived((canEdit && Boolean(onEdit)) || (canDelete && Boolean(onDelete)));
</script>

<div class="ui:flex ui:w-full ui:items-center ui:justify-between {className}">
  <div class="ui:flex ui:items-center ui:gap-2">
    <UserAvatar src={avatarUrl || undefined} alt={fullname || 'User Avatar'} class={avatarSize} />
    <div class="ui:flex ui:items-center ui:gap-2">
      {#if fullname}
        <span class="ui:text-sm ui:font-semibold ui:capitalize ui:text-foreground">{fullname}</span>
      {/if}
      {#if roleBadge}
        <Badge variant="secondary" class="ui:text-[10px] ui:px-1.5 ui:py-0.5">{roleBadge}</Badge>
      {/if}
      {#if displayDate}
        <span class="ui:text-xs ui:font-normal ui:text-muted-foreground">{displayDate}</span>
      {/if}
    </div>
  </div>

  {#if actions}
    {@render actions()}
  {:else if hasActions}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="ui:inline-flex ui:h-7 ui:w-7 ui:items-center ui:justify-center ui:rounded-md ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-foreground"
      >
        <EllipsisVerticalIcon class="ui:size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        {#if canEdit && onEdit}
          <DropdownMenu.Item onclick={onEdit}>
            <PencilIcon class="ui:mr-2 ui:size-3.5" />
            <span>{editLabel}</span>
          </DropdownMenu.Item>
        {/if}
        {#if canDelete && onDelete}
          <DropdownMenu.Item class="ui:text-destructive ui:focus:text-destructive" onclick={onDelete}>
            <Trash2Icon class="ui:mr-2 ui:size-3.5" />
            <span>{deleteLabel}</span>
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
