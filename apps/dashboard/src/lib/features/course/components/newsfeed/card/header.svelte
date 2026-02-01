<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import { calDateDiff } from '$lib/utils/functions/date';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { sanitizeHtml } from '@cio/ui/tools/sanitize';

  import type { Feed } from '$features/course/utils/types';
  import { HTMLRender, RoleBasedSecurity } from '$features/ui';

  interface Props {
    feed: Feed;
    onPin: (feedId: Feed['id'], isPinned: Feed['isPinned']) => void;
    onEdit: () => void;
    onRequestDelete: () => void;
  }

  let { feed, onPin, onEdit, onRequestDelete }: Props = $props();
</script>

<div class="px-3 pt-3 pb-0">
  <div class="mb-2 flex justify-between">
    <span class="flex items-center gap-3">
      <div class="h-9 w-9">
        <img src={feed.authorAvatarUrl || ''} alt="users banner" class="h-full w-full rounded-full object-cover" />
      </div>
      <span>
        <p class="text-base font-semibold capitalize">{feed.authorFullname || ''}</p>
        <p class="text-sm font-medium text-gray-600">{calDateDiff(feed.createdAt)}</p>
      </span>
    </span>

    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          <EllipsisVerticalIcon class="h-5 w-5" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={() => onPin(feed.id, feed.isPinned)}>
            {feed.isPinned ? 'Unpin' : 'Pin'}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={onEdit}>Edit</DropdownMenu.Item>
          <DropdownMenu.Item class="text-red-600" onclick={onRequestDelete}>Delete</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </RoleBasedSecurity>
  </div>

  {#if !isHtmlValueEmpty(feed.content || '')}
    <HTMLRender className="w-[80%]">
      <div>
        {@html sanitizeHtml(feed.content || '')}
      </div>
    </HTMLRender>
  {/if}
</div>
