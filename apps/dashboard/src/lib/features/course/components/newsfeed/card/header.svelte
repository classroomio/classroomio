<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import PinIcon from '@lucide/svelte/icons/pin';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';

  import { calDateDiff } from '$lib/utils/functions/date';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '$lib/utils/functions/translations';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';

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

<div class="px-4 pt-4 pb-0">
  <div class="mb-2 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <UserAvatar src={feed.authorAvatarUrl} class="size-10" />
      <div class="flex flex-col">
        <p class="text-foreground text-sm font-semibold capitalize">{feed.authorFullname || 'Anonymous'}</p>
        <p class="text-muted-foreground text-xs font-normal">{calDateDiff(feed.createdAt)}</p>
      </div>
    </div>

    <RoleBasedSecurity allowedRoles={[1, 2]}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-8 w-8 items-center justify-center rounded-md transition-colors"
        >
          <EllipsisVerticalIcon class="h-4 w-4" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={() => onPin(feed.id, feed.isPinned)}>
            <span class="flex items-center gap-2">
              <PinIcon size={14} />
              {feed.isPinned ? $t('course.navItem.news_feed.card.unpin') : $t('course.navItem.news_feed.card.pin')}
            </span>
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={onEdit}>
            <span class="flex items-center gap-2">
              <PencilIcon size={14} />
              {$t('course.navItem.news_feed.card.edit')}
            </span>
          </DropdownMenu.Item>
          <DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={onRequestDelete}>
            <span class="flex items-center gap-2">
              <Trash2Icon size={14} />
              {$t('course.navItem.news_feed.card.delete')}
            </span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </RoleBasedSecurity>
  </div>

  {#if !isHtmlValueEmpty(feed.content || '')}
    <HTMLRender
      className="w-full text-foreground text-sm font-normal md:text-sm prose-headings:text-base prose-headings:font-semibold prose-headings:mb-2 prose-p:mb-2 prose-a:text-primary"
    >
      <div>
        <SafeHtmlContent content={feed.content || ''} />
      </div>
    </HTMLRender>
  {/if}
</div>
