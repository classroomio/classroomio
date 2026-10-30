<script lang="ts">
  import { onMount } from 'svelte';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { t } from '$lib/utils/functions/translations';

  import { insightsApi } from '../api';
  import { formatUpdatedAgo } from '../utils/insights-utils';

  let now = $state(Date.now());

  onMount(() => {
    const timer = setInterval(() => (now = Date.now()), 1000);

    return () => clearInterval(timer);
  });

  const updatedLabel = $derived(formatUpdatedAgo(insightsApi.generatedAt, now, $t));
  const tooltipText = $derived($t('insights.chips.live', { updated: updatedLabel }));
</script>

{#if updatedLabel}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger
        type="button"
        aria-label={tooltipText}
        class="ui:focus-visible:ring-ring inline-flex items-center justify-center self-center rounded-full p-1 transition-opacity hover:opacity-80 focus-visible:ring-1 focus-visible:outline-none"
      >
        <span class="relative mt-1 flex size-2 items-center justify-center">
          <span class="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content side="bottom" align="start" class="text-xs">
        {tooltipText}
      </Tooltip.Content>
    </Tooltip.Root>
  </Tooltip.Provider>
{/if}
