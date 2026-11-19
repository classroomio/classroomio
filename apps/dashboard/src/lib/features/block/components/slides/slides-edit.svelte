<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { blockChangeLabel } from '../../utils/block-labels';
  import { slidesFrameTitle } from './slides-utils';
  import type { BlockEditProps } from '../../utils/types';

  let { block, onRequestSource }: BlockEditProps<'slides'> = $props();

  const slide = $derived({ id: block.id, ...block.data });
</script>

<Block.Slide
  {slide}
  editable
  frameTitle={slidesFrameTitle(block.data.platform)}
  changeLabel={blockChangeLabel('slides')}
  onChange={onRequestSource}
/>
