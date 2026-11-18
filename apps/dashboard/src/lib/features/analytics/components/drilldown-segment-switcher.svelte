<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import * as Tabs from '@cio/ui/base/tabs';
  import { t } from '$lib/utils/functions/translations';

  import { analyticsDrilldownApi } from '../api';

  const switcher = $derived(analyticsDrilldownApi.switcher);
  const activeOption = $derived(switcher?.options.find((option) => option.key === switcher.activeKey));

  function handleChange(segmentKey: string) {
    void analyticsDrilldownApi.selectSegment(segmentKey);
  }
</script>

{#if switcher}
  <div class="px-4">
    {#if switcher.control === 'select'}
      <Select.Root type="single" value={switcher.activeKey} onValueChange={handleChange}>
        <Select.Trigger
          class="w-full"
          aria-label={$t('analytics.drilldown.segment_label')}
          data-testid="analytics-drilldown-switcher"
        >
          <span class="truncate">{activeOption?.label}</span>
        </Select.Trigger>
        <Select.Content>
          {#each switcher.options as option (option.key)}
            <Select.Item value={option.key} label={option.label} data-testid="analytics-drilldown-segment-option">
              <span class="truncate">{option.label}</span>
            </Select.Item>
          {/each}
        </Select.Content>
      </Select.Root>
    {:else}
      <Tabs.Root value={switcher.activeKey} onValueChange={handleChange}>
        <Tabs.List
          class="h-auto w-full flex-wrap justify-start"
          aria-label={$t('analytics.drilldown.segment_label')}
          data-testid="analytics-drilldown-switcher"
        >
          {#each switcher.options as option (option.key)}
            <Tabs.Trigger value={option.key} data-testid="analytics-drilldown-segment-{option.key}">
              {option.label}
              {#if option.count !== null}
                <span class="ui:text-muted-foreground tabular-nums">{option.count}</span>
              {/if}
            </Tabs.Trigger>
          {/each}
        </Tabs.List>
      </Tabs.Root>
    {/if}
  </div>
{/if}
