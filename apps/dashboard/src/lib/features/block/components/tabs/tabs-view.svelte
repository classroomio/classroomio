<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getTabsLabels } from './tabs-labels';
  import TabsMedia from './tabs-media.svelte';

  let { block, index }: BlockViewProps<'tabs'> = $props();
</script>

<Block.Tabs tabs={block.data.tabs} align={block.data.align} labels={getTabsLabels()} testId="block-tabs">
  {#snippet content(tabId)}
    {@const tab = block.data.tabs.find((candidate) => candidate.id === tabId)}
    <TabsMedia media={tab?.media} blockId={block.id} {tabId} {index} />
  {/snippet}
</Block.Tabs>
