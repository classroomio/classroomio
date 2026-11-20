<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { slidesFrameTitle } from './slides-utils';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'slides'> = $props();

  const slide = $derived({ id: block.id, ...block.data });
</script>

<Block.Slide {slide} editable={false} frameTitle={slidesFrameTitle(block.data.platform)} />
