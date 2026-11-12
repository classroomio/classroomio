<script lang="ts">
  import type { Component } from 'svelte';
  import * as Block from '@cio/ui/custom/block';
  import type { TBlockType } from '@cio/utils/validation/block';
  import { t } from '$lib/utils/functions/translations';
  import { setBlockViewHost } from '../utils/block-host';
  import { blockTypeLabelKey } from '../utils/block-labels';
  import { BLOCK_VIEWS } from '../utils/block-view-registry';
  import type { BlockViewHost, BlockViewModel, BlockViewProps } from '../utils/types';

  interface Props {
    blocks: BlockViewModel[];
    host: BlockViewHost;
    emptyTitle: string;
    emptyDescription: string;
    spacingClass?: string;
    showRail?: boolean;
  }

  let { blocks, host, emptyTitle, emptyDescription, spacingClass, showRail = true }: Props = $props();

  setBlockViewHost(() => host);
</script>

<Block.List
  items={blocks}
  {spacingClass}
  {showRail}
  {emptyTitle}
  {emptyDescription}
  emptyMachineHeading={t.get('course.navItem.lessons.add_content_options.lesson_title').toLocaleUpperCase()}
  scrollRailLabel={t.get('course.navItem.lessons.materials.blocks.scroll_rail')}
  goToBlockLabel={(index) => t.get('course.navItem.lessons.materials.blocks.go_to_block', { index })}
  itemTitle={(block) => t.get(blockTypeLabelKey(block.type))}
>
  {#snippet renderItem({ item: block, index })}
    {@const View = BLOCK_VIEWS[block.type] as Component<BlockViewProps<TBlockType>>}
    <Block.Shell blockId={block.id} label={t.get(blockTypeLabelKey(block.type))}>
      <View block={block as BlockViewModel<TBlockType>} {index} />
    </Block.Shell>
  {/snippet}
</Block.List>
