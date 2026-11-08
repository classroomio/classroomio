<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { FIELDS } from './item-fields';

  const choice: AddBlock.AddBlockChoice = { type: 'note', label: 'Note', icon: BookOpenIcon };

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Item',
    component: AddBlock.Item,
    args: {
      choice,
      compact: true
    },
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onSelect: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Compact">
  {#snippet template()}
    <AddBlock.Item {choice} compact onSelect={(type) => console.log('add', type)} />
  {/snippet}
</Story>

<Story name="Comfortable">
  {#snippet template()}
    <AddBlock.Item {choice} onSelect={(type) => console.log('add', type)} />
  {/snippet}
</Story>

<Story name="LabelHiddenOnMobile">
  {#snippet template()}
    <AddBlock.Item {choice} hideLabelOnMobile onSelect={(type) => console.log('add', type)} />
  {/snippet}
</Story>
