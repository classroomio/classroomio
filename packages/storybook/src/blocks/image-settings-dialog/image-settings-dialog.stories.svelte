<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Blocks/ImageSettingsDialog',
    component: Block.ImageSettingsDialog,
    args: {
      open: true,
      alt: 'Two people reviewing a course together on a laptop',
      fit: 'cover'
    },
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onSave: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Open">
  {#snippet template(args)}
    <Block.ImageSettingsDialog {...args} onSave={(settings) => console.log('save', settings)} />
  {/snippet}
</Story>

<Story name="ContainFit">
  {#snippet template(args)}
    <Block.ImageSettingsDialog {...args} fit="contain" onSave={(settings) => console.log('save', settings)} />
  {/snippet}
</Story>
