<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Item from '@cio/ui/base/item';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import SquareCheckIcon from '@lucide/svelte/icons/square-check-big';
  import { EmptyState } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import type { PathAnalyticsStuckItem } from '../../utils/types';

  interface Props {
    items: PathAnalyticsStuckItem[];
  }

  let { items }: Props = $props();
</script>

{#if items.length === 0}
  <EmptyState
    title={$t('learningPath.analytics.stuck.empty')}
    description={$t('learningPath.analytics.stuck.empty_desc')}
  />
{:else}
  <div class="flex flex-col gap-2">
    {#each items as item (item.itemType + ':' + item.itemId)}
      <Item.Root variant="muted" class="p-3! sm:px-3.5! sm:py-3!">
        <Item.Media variant="icon" class="mt-0.5 self-start">
          {#if item.itemType === 'lesson'}
            <BookOpenIcon class="custom ui:text-muted-foreground" aria-hidden="true" />
          {:else}
            <SquareCheckIcon class="custom ui:text-muted-foreground" aria-hidden="true" />
          {/if}
        </Item.Media>
        <Item.Content class="min-w-0 gap-0.5!">
          <Item.Title class="min-w-0 break-words">
            {#if item.itemType === 'lesson'}
              {$t('learningPath.analytics.stuck.lesson_prefix')}
            {:else}
              {$t('learningPath.analytics.stuck.exercise_prefix')}
            {/if}
            {item.itemTitle}
            {#if item.courseTitle}
              <span class="ui:text-muted-foreground font-normal">· {item.courseTitle}</span>
            {/if}
          </Item.Title>
          <Item.Description class="text-[13px]!">
            {#if item.itemType === 'lesson'}
              {$t('learningPath.analytics.stuck.lesson_desc', { count: item.stuckCount })}
            {:else}
              {$t('learningPath.analytics.stuck.exercise_desc', { count: item.stuckCount })}
            {/if}
          </Item.Description>
        </Item.Content>
        <Item.Actions class="shrink-0 self-center">
          <Badge
            class="shrink-0 border-transparent bg-amber-500/10 font-medium text-amber-600 tabular-nums dark:text-amber-400"
          >
            {$t('learningPath.analytics.stuck.badge', { count: item.stuckCount })}
          </Badge>
        </Item.Actions>
      </Item.Root>
    {/each}
  </div>
{/if}
