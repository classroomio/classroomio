<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getProcessLabels } from './process-labels';

  let { block }: BlockViewProps<'process'> = $props();
</script>

<Block.Process steps={block.data.steps} labels={getProcessLabels()} testId="block-process" />
