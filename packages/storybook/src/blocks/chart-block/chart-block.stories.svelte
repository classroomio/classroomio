<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { ChartBlockLabels, ChartBlockPoint, ChartBlockType } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: ChartBlockLabels = {
    title: 'Chart title',
    titlePlaceholder: 'Chart title',
    chartType: 'Chart type',
    types: { bar: 'Bar chart', line: 'Line chart', pie: 'Pie chart', donut: 'Donut chart' },
    pointCount: (count) => `${count} ${count === 1 ? 'data point' : 'data points'}`,
    highest: 'Highest',
    total: 'Total',
    editData: 'Edit data',
    liveHint: 'Changes update the chart live.',
    labelColumn: 'Label',
    valueColumn: 'Value',
    labelPlaceholder: 'Label',
    addPoint: 'Add data point',
    removePoint: 'Remove data point'
  };

  const POINTS: ChartBlockPoint[] = [
    { id: 'q1', label: 'Q1', value: 30 },
    { id: 'q2', label: 'Q2', value: 55 },
    { id: 'q3', label: 'Q3', value: 40 },
    { id: 'q4', label: 'Q4', value: 70 }
  ];

  const ZERO_POINTS: ChartBlockPoint[] = POINTS.map((point) => ({ ...point, value: 0 }));

  const TWELVE_POINTS: ChartBlockPoint[] = Array.from({ length: 12 }, (_, index) => ({
    id: `m${index + 1}`,
    label: new Date(2026, index, 1).toLocaleString('en', { month: 'short' }),
    value: Math.round(40 + 30 * Math.sin(index / 2))
  }));

  const { Story } = defineMeta({
    title: 'Blocks/ChartBlock',
    component: Block.Chart,
    args: {
      title: 'Quarterly revenue',
      type: 'bar',
      points: POINTS,
      editable: false,
      maxPoints: 12,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      type: { control: 'inline-radio', options: ['bar', 'line', 'pie', 'donut'] },
      onTitleInput: { control: false },
      onTypeChange: { control: false },
      onPointLabelInput: { control: false },
      onPointValueInput: { control: false },
      onAddPoint: { control: false },
      onRemovePoint: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let editTitle = $state('Quarterly revenue');
  let editType = $state<ChartBlockType>('bar');
  let editPoints = $state([...POINTS]);
  let nextPointNumber = 1;

  function updatePoint(pointId: string, changes: Partial<ChartBlockPoint>) {
    editPoints = editPoints.map((point) => (point.id === pointId ? { ...point, ...changes } : point));
  }

  function addPoint() {
    editPoints = [...editPoints, { id: `new-${nextPointNumber}`, label: 'New', value: 0 }];
    nextPointNumber += 1;
  }
</script>

<Story name="LearnerBar">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} type="bar" />
    </div>
  {/snippet}
</Story>

<Story name="LearnerLine">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} type="line" />
    </div>
  {/snippet}
</Story>

<Story name="LearnerPie">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} type="pie" />
    </div>
  {/snippet}
</Story>

<Story name="LearnerDonut">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} type="donut" />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart
        {...args}
        editable
        title={editTitle}
        type={editType}
        points={editPoints}
        onTitleInput={(title) => (editTitle = title)}
        onTypeChange={(type) => (editType = type)}
        onPointLabelInput={(pointId, label) => updatePoint(pointId, { label })}
        onPointValueInput={(pointId, value) => updatePoint(pointId, { value })}
        onAddPoint={addPoint}
        onRemovePoint={(pointId) => (editPoints = editPoints.filter((point) => point.id !== pointId))}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditEmptyTitle">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} editable title="" />
    </div>
  {/snippet}
</Story>

<Story name="EditSinglePoint">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} editable points={POINTS.slice(0, 1)} />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMaximumPoints">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} editable title="Monthly sign-ups" type="line" points={TWELVE_POINTS} />
    </div>
  {/snippet}
</Story>

<Story name="AllZeroDonut">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} type="donut" points={ZERO_POINTS} />
    </div>
  {/snippet}
</Story>

<Story name="AllZeroBar">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Chart {...args} points={ZERO_POINTS} />
    </div>
  {/snippet}
</Story>

<Story name="Narrow">
  {#snippet template(args)}
    <div class="w-[360px]">
      <Block.Chart {...args} type="pie" />
    </div>
  {/snippet}
</Story>
