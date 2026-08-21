<script lang="ts">
  import { Button } from '../../base/button';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';

  interface Props {
    onReply?: () => void;
    canDelete?: boolean;
    onDelete?: () => void;
    replyLabel?: string;
    deleteLabel?: string;
    class?: string;
  }

  let {
    onReply,
    canDelete = false,
    onDelete,
    replyLabel = 'Reply',
    deleteLabel = 'Delete',
    class: className = ''
  }: Props = $props();
</script>

<div class="ui:flex ui:items-center ui:gap-1 {className}">
  {#if onReply}
    <Button
      variant="ghost"
      size="xs"
      onclick={onReply}
      class="ui:h-6 ui:gap-1 ui:px-1.5 ui:text-xs ui:text-muted-foreground ui:hover:text-foreground"
    >
      <MessageSquareIcon size={14} />
      <span>{replyLabel}</span>
    </Button>
  {/if}

  {#if canDelete && onDelete}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        class="ui:inline-flex ui:h-7 ui:w-7 ui:items-center ui:justify-center ui:rounded-md ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-foreground"
      >
        <EllipsisVerticalIcon class="ui:size-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item class="ui:text-destructive ui:focus:text-destructive" onclick={onDelete}>
          {deleteLabel}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {/if}
</div>
