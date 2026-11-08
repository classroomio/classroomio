<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const menuItems: Block.BlockShellMenuItem[] = [
    { label: 'Change video', icon: PencilIcon, onSelect: () => console.log('change') },
    { label: 'Move up', icon: ArrowUpIcon, disabled: true, onSelect: () => console.log('up') },
    { label: 'Move down', icon: ArrowDownIcon, onSelect: () => console.log('down') },
    { label: 'Remove', icon: Trash2Icon, destructive: true, onSelect: () => console.log('remove') }
  ];

  const { Story } = defineMeta({
    title: 'Blocks/BlockShell',
    component: Block.Shell,
    args: {
      blockId: 'demo-block',
      label: 'Video',
      editable: true,
      draggable: true,
      dragLabel: 'Drag to reorder',
      actionsLabel: 'Block actions'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      menuItems: { control: false },
      children: { control: false }
    },
    tags: ['autodocs']
  });
</script>

{#snippet sampleContent()}
  <div class="flex flex-col gap-2">
    <p class="ui:text-foreground text-sm font-medium">How retrieval grounds an answer</p>
    <p class="ui:text-muted-foreground text-sm">
      The model answers only from the passages that were fetched for the question. Anything the sources do not cover
      stays unsaid.
    </p>
    <div class="ui:bg-muted mt-2 flex h-32 items-center justify-center rounded-lg">
      <span class="ui:text-muted-foreground text-xs">Block body</span>
    </div>
  </div>
{/snippet}

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args} editable={false}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args} {menuItems}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>

<Story name="ExampleBadge">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args} badge="Example" {menuItems}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>

<Story name="Highlighted">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args} highlighted={true} {menuItems}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>

<Story name="NotDraggable">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args} draggable={false} {menuItems}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>

<Story name="WithoutMenu">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Shell {...args}>{@render sampleContent()}</Block.Shell>
    </div>
  {/snippet}
</Story>
