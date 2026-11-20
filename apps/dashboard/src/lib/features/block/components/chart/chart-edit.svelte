<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import {
    CHART_LABEL_MAX_LENGTH,
    CHART_MAX_POINTS,
    CHART_TITLE_MAX_LENGTH,
    CHART_VALUE_MAX
  } from '@cio/utils/validation/block';
  import type { BlockEditProps } from '../../utils/types';
  import { getChartLabels, getNewPointLabel } from './chart-labels';
  import { addPoint, removePoint, setChartTitle, setChartType, setPointLabel, setPointValue } from './chart-utils';

  let { block, onDataChange }: BlockEditProps<'chart'> = $props();
</script>

<Block.Chart
  editable
  title={block.data.title}
  type={block.data.type}
  points={block.data.points}
  maxPoints={CHART_MAX_POINTS}
  maxValue={CHART_VALUE_MAX}
  titleMaxLength={CHART_TITLE_MAX_LENGTH}
  labelMaxLength={CHART_LABEL_MAX_LENGTH}
  labels={getChartLabels()}
  testId="block-chart-edit"
  onTitleInput={(title) => onDataChange(setChartTitle(block.data, title))}
  onTypeChange={(type) => onDataChange(setChartType(block.data, type))}
  onPointLabelInput={(pointId, label) => onDataChange(setPointLabel(block.data, pointId, label))}
  onPointValueInput={(pointId, value) => onDataChange(setPointValue(block.data, pointId, value))}
  onAddPoint={() => onDataChange(addPoint(block.data, getNewPointLabel()))}
  onRemovePoint={(pointId) => onDataChange(removePoint(block.data, pointId))}
/>
