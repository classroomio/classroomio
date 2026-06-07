<script lang="ts">
  import { resolve } from '$app/paths';
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  import { t } from '$lib/utils/functions/translations';
  import type { RunChangedItem } from '$features/ai-assistant/utils/types';

  interface Props {
    items: RunChangedItem[];
    courseId: string;
    onNavigate: (route: string) => void;
    /** Optional status label rendered next to the count ("Completed", "Canceled", …). */
    statusLabel?: string | null;
  }

  let { items, courseId, onNavigate, statusLabel = null }: Props = $props();

  let isExpanded = $state(true);

  function toggle() {
    isExpanded = !isExpanded;
  }

  function pathFor(item: RunChangedItem): string {
    if (item.targetType === 'lesson') {
      return resolve(`/courses/${courseId}/lessons/${item.targetId}`, {});
    }

    return resolve(`/courses/${courseId}/exercises/${item.targetId}`, {});
  }

  function formatTokens(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }
</script>

<div class="ui:bg-background rounded-t-lg border-t text-xs">
  <button
    type="button"
    onclick={toggle}
    class="hover:ui:bg-muted/40 flex w-full cursor-pointer items-center gap-2 rounded-t-lg px-3 py-1.5 text-left"
    aria-expanded={isExpanded}
    aria-label={isExpanded ? $t('ai_assistant.changes_card.collapse') : $t('ai_assistant.changes_card.expand')}
  >
    {#if isExpanded}
      <ChevronDownIcon size={12} class="ui:text-muted-foreground shrink-0" />
    {:else}
      <ChevronRightIcon size={12} class="ui:text-muted-foreground shrink-0" />
    {/if}
    <span class="ui:text-foreground font-medium">
      {$t('ai_assistant.changes_card.summary_count', { count: items.length })}
    </span>
    {#if statusLabel}
      <span class="ui:text-muted-foreground">· {statusLabel}</span>
    {/if}
  </button>

  {#if isExpanded}
    <ul class="max-h-48 overflow-y-auto">
      {#each items as item (item.targetType + ':' + item.targetId)}
        <li>
          <button
            type="button"
            onclick={() => onNavigate(pathFor(item))}
            class="hover:ui:bg-muted/40 flex w-full cursor-pointer items-center gap-2 px-3 py-1 text-left"
          >
            {#if item.targetType === 'lesson'}
              <LessonIcon size={12} />
            {:else}
              <ExerciseIcon size={12} />
            {/if}

            <span
              class="ui:text-primary min-w-0 flex-1 truncate font-medium underline decoration-dotted underline-offset-2 hover:opacity-80"
            >
              {item.title}
            </span>

            {#if item.tokens}
              <span class="ui:text-muted-foreground shrink-0 tabular-nums">{formatTokens(item.tokens)}</span>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
