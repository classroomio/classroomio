<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { shortenName } from '$lib/utils/functions/string';
  import { t } from '$lib/utils/functions/translations';
  import type { NotificationItem } from '../utils/types';

  interface Props {
    item: NotificationItem;
    onSelect: (item: NotificationItem) => void;
  }

  let { item, onSelect }: Props = $props();
</script>

<button
  type="button"
  onclick={() => onSelect(item)}
  class="ui:hover:bg-muted grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 text-left transition-colors"
>
  <Avatar.Root class="size-8">
    {#if item.avatarUrl}
      <Avatar.Image src={item.avatarUrl} alt={item.avatarName} />
    {/if}
    <Avatar.Fallback class="text-xs">{shortenName(item.avatarName)}</Avatar.Fallback>
  </Avatar.Root>

  <div class="min-w-0 space-y-0.5">
    <p class="text-sm font-medium">{$t(item.title.key, item.title.params)}</p>
    <p class="ui:text-muted-foreground text-xs">{$t(item.body.key, item.body.params)}</p>
    <p class="ui:text-muted-foreground text-xs">{calDateDiff(item.createdAt)}</p>
  </div>

  {#if item.unread}
    <span class="ui:bg-primary mt-1.5 size-2 shrink-0 rounded-full">
      <span class="sr-only">{$t('notifications.unread')}</span>
    </span>
  {/if}
</button>
