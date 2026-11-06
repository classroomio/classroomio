<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ChartLegendItem from '@cio/ui/base/chart/chart-legend-item.svelte';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Chart legend item',
    component: ChartLegendItem,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      item: { control: false },
      showValue: { control: 'boolean' }
    },
    tags: ['autodocs']
  });

  const graduates = { label: 'Graduates', color: 'var(--chart-1)', value: 128 };
  const completionTarget = { label: 'Completion target', color: 'var(--chart-3)', dashed: true, value: 75 };
</script>

<Story name="Default">
  {#snippet template()}
    <ChartLegendItem item={graduates} />
  {/snippet}
</Story>

<Story name="Without value">
  {#snippet template()}
    <ChartLegendItem item={graduates} showValue={false} />
  {/snippet}
</Story>

<Story name="Dashed swatch with value">
  {#snippet template()}
    <ChartLegendItem item={completionTarget} />
  {/snippet}
</Story>

<Story name="Dashed swatch without value">
  {#snippet template()}
    <ChartLegendItem item={{ ...completionTarget, value: undefined }} />
  {/snippet}
</Story>

<Story name="Truncated label">
  {#snippet template()}
    <div class="w-40 overflow-hidden">
      <ChartLegendItem
        item={{
          label: 'Learners who completed every required exercise in the cohort',
          color: 'var(--chart-2)',
          value: 412
        }}
      />
    </div>
  {/snippet}
</Story>
