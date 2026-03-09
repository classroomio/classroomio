<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as ToggleGroup from '@cio/ui/base/toggle-group';

  const { Story } = defineMeta({
    title: 'Atom/ToggleGroup',
    component: ToggleGroup.Root,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="Single Select">
  {#snippet template()}
    <ToggleGroup.Root type="single" value="true" variant="outline">
      <ToggleGroup.Item value="true">True</ToggleGroup.Item>
      <ToggleGroup.Item value="false">False</ToggleGroup.Item>
    </ToggleGroup.Root>
  {/snippet}
</Story>

<Story name="Multiple Select">
  {#snippet template()}
    <ToggleGroup.Root type="multiple" value={['email']} variant="outline" size="sm" spacing={2}>
      <ToggleGroup.Item value="email">Email</ToggleGroup.Item>
      <ToggleGroup.Item value="sms">SMS</ToggleGroup.Item>
      <ToggleGroup.Item value="push">Push</ToggleGroup.Item>
    </ToggleGroup.Root>
  {/snippet}
</Story>
