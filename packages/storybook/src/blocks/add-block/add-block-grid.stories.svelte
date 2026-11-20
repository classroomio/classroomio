<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { ALL_CHOICES } from './choices';
  import { FIELDS } from './grid-fields';

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Grid',
    component: AddBlock.Grid,
    args: {
      choices: ALL_CHOICES,
      label: 'Add content',
      size: 'lg'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      size: { control: 'inline-radio', options: ['lg', 'sm'] },
      onSelect: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let lastSelection = $state('none');
</script>

<Story name="Large">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-[560px]">
      <p class="text-muted-foreground mb-4 text-sm">Last selection: {lastSelection}</p>
      <AddBlock.Grid {...args} onSelect={(type) => (lastSelection = type)} />
    </div>
  {/snippet}
</Story>

<Story name="LargeNarrow">
  {#snippet template(args)}
    <div class="w-[320px]">
      <AddBlock.Grid {...args} onSelect={() => {}} />
    </div>
  {/snippet}
</Story>

<Story name="Small">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-[420px]">
      <AddBlock.Grid {...args} size="sm" onSelect={() => {}} />
    </div>
  {/snippet}
</Story>

<Story name="SmallNarrow">
  {#snippet template(args)}
    <div class="w-[300px]">
      <AddBlock.Grid {...args} size="sm" onSelect={() => {}} />
    </div>
  {/snippet}
</Story>
