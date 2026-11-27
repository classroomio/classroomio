<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { InviteOutcomeRow } from './invite-utils';

  interface Props {
    titleKey: string;
    items: InviteOutcomeRow[];
  }

  let { titleKey, items }: Props = $props();
</script>

{#if items.length > 0}
  <div class="ui:bg-muted rounded-lg p-3">
    <p class="mb-1 text-sm font-medium">{$t(titleKey)}</p>
    <ul class="max-h-40 space-y-1 overflow-y-auto">
      {#each items as item, index (`${index}:${item.email}`)}
        <li class="ui:text-muted-foreground flex items-center justify-between gap-2 text-xs">
          <span class="truncate">{item.email}</span>
          <span class="shrink-0 font-medium">{$t(item.labelKey)}</span>
        </li>
      {/each}
    </ul>
  </div>
{/if}
