<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DensityControl, type DensityControlValue } from '@cio/ui';
  import { FIELDS } from './fields';

  const options = [
    { value: 'compact' as const, label: 'Compact' },
    { value: 'comfortable' as const, label: 'Comfortable' },
    { value: 'spacious' as const, label: 'Spacious' }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/DensityControl',
    component: DensityControl,
    args: {
      value: 'comfortable' as DensityControlValue,
      options,
      groupLabel: 'Reading density'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  import type { DensityControlValue } from '@cio/ui';

  let interactiveValue: DensityControlValue = $state('comfortable');
</script>

<Story name="Comfortable">
  {#snippet template(args)}
    <DensityControl {...args} value="comfortable" onChange={(value) => console.log('density', value)} />
  {/snippet}
</Story>

<Story name="Compact">
  {#snippet template(args)}
    <DensityControl {...args} value="compact" onChange={(value) => console.log('density', value)} />
  {/snippet}
</Story>

<Story name="Spacious">
  {#snippet template(args)}
    <DensityControl {...args} value="spacious" onChange={(value) => console.log('density', value)} />
  {/snippet}
</Story>

<Story name="Interactive">
  {#snippet template()}
    <DensityControl
      {options}
      value={interactiveValue}
      groupLabel="Reading density"
      onChange={(next) => (interactiveValue = next)}
    />
  {/snippet}
</Story>
