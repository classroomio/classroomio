<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import type { BlockViewProps } from '../../utils/types';
  import { getChartLabels } from './chart-labels';

  let { block }: BlockViewProps<'chart'> = $props();
</script>

<Block.Chart
  title={block.data.title}
  type={block.data.type}
  points={block.data.points}
  labels={getChartLabels()}
  testId="block-chart"
/>
