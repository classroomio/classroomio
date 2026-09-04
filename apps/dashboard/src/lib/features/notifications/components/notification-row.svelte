<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { shortenName } from '$lib/utils/functions/string';
  import { t } from '$lib/utils/functions/translations';
  import type { NotificationItem, NotificationText } from '../utils/types';

  interface Props {
    item: NotificationItem;
    onSelect: (item: NotificationItem) => void;
  }

  let { item, onSelect }: Props = $props();

  /** Resolves key-valued params so nested labels follow the active locale too. */
  function resolveText(text: NotificationText): string {
    const keyParams = Object.entries(text.keyParams ?? {}).reduce<Record<string, string>>((acc, [name, key]) => {
      acc[name] = $t(key);

      return acc;
    }, {});

    return $t(text.key, { ...text.params, ...keyParams });
  }
</script>

<button
  type="button"
  onclick={() => onSelect(item)}
  class="ui:hover:bg-muted grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 text-left transition-colors"
>
  <!-- Squared like the org switcher: these are organizations, not people. Prefixed so it
       dedupes against the `ui:rounded-full` baked into Avatar.Root. -->
  <Avatar.Root class="ui:flex ui:size-8 ui:items-center ui:justify-center ui:rounded-lg">
    {#if item.avatarUrl}
      <Avatar.Image src={item.avatarUrl} alt={item.avatarName} />
    {/if}
    <Avatar.Fallback class="ui:rounded-lg text-xs">{shortenName(item.avatarName)}</Avatar.Fallback>
  </Avatar.Root>

  <div class="min-w-0 space-y-0.5">
    <p class="text-sm font-medium">{resolveText(item.title)}</p>
    <p class="ui:text-muted-foreground text-xs">{resolveText(item.body)}</p>
    <p class="ui:text-muted-foreground text-xs">{calDateDiff(item.createdAt)}</p>
  </div>

  {#if item.unread}
    <span class="ui:bg-primary mt-1.5 size-2 shrink-0 rounded-full">
      <span class="sr-only">{$t('notifications.unread')}</span>
    </span>
  {/if}
</button>
