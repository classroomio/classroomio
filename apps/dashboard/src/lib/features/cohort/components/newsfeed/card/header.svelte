<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { isHtmlValueEmpty } from '$lib/utils/functions/toHtml';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { t } from '$lib/utils/functions/translations';
  import type { CohortNewsfeedItem } from '$features/cohort/utils/types';
  import { HTMLRender } from '$features/ui';

  interface Props {
    feed: CohortNewsfeedItem;
    canManageFeed?: boolean;
    onPin: (feedId: CohortNewsfeedItem['id'], isPinned: CohortNewsfeedItem['isPinned']) => void;
    onEdit: () => void;
    onRequestDelete: () => void;
  }

  let { feed, canManageFeed = false, onPin, onEdit, onRequestDelete }: Props = $props();
</script>

<div class="px-3 pt-3 pb-0">
  <div class="mb-2 flex justify-between">
    <span class="flex items-center gap-3">
      <div class="h-9 w-9">
        <img
          src={feed.authorAvatarUrl || ''}
          alt={$t('cohorts.newsfeed.user_avatar_alt')}
          class="h-full w-full rounded-full object-cover"
        />
      </div>
      <span>
        <p class="text-base font-semibold capitalize">{feed.authorFullname || ''}</p>
        <p class="text-sm font-medium text-gray-600">{calDateDiff(feed.createdAt)}</p>
      </span>
    </span>

    {#if canManageFeed}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
        >
          <EllipsisVerticalIcon class="h-5 w-5" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end">
          <DropdownMenu.Item onclick={() => onPin(feed.id, feed.isPinned)}>
            {feed.isPinned ? $t('cohorts.newsfeed.card.unpin') : $t('cohorts.newsfeed.card.pin')}
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={onEdit}>{$t('cohorts.newsfeed.card.edit')}</DropdownMenu.Item>
          <DropdownMenu.Item class="text-red-600" onclick={onRequestDelete}>
            {$t('cohorts.newsfeed.card.delete')}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    {/if}
  </div>

  {#if !isHtmlValueEmpty(feed.content || '')}
    <HTMLRender className="w-[80%]">
      <div>
        <SafeHtmlContent content={feed.content || ''} />
      </div>
    </HTMLRender>
  {/if}
</div>
