<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PresentationIcon from '@lucide/svelte/icons/presentation';
  import VideoIcon from '@lucide/svelte/icons/video';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  interface DemoBlock {
    id: string;
    label: string;
    title: string;
    body: string;
    badge?: string;
  }

  const addChoices: AddBlock.AddBlockChoice[] = [
    { type: 'note', label: 'Note', icon: BookOpenIcon },
    { type: 'video', label: 'Video', icon: VideoIcon },
    { type: 'slide', label: 'Slides', icon: PresentationIcon },
    { type: 'document', label: 'Document', icon: FileTextIcon },
    { type: 'image', label: 'Image', icon: ImageIcon }
  ];

  const demoBlocks: DemoBlock[] = [
    {
      id: 'retrieval',
      label: 'Note',
      title: 'Retrieval grounds the answer',
      body: 'Fetch the passages first, then ask the model to answer only from what came back.'
    },
    {
      id: 'video',
      label: 'Video',
      title: 'Watch: grounding a prompt',
      badge: 'Example',
      body: 'A four minute walkthrough of a retrieval-augmented prompt.'
    },
    {
      id: 'checklist',
      label: 'Note',
      title: 'Before you ship',
      body: 'Check that missing evidence stays visible, and that every claim maps to a source.'
    }
  ];

  const railLabels = {
    scrollRailLabel: 'Lesson blocks',
    goToBlockLabel: (index: number) => `Go to block ${index}`
  };

  const { Story } = defineMeta({
    title: 'Blocks/BlockList',
    component: Block.List,
    args: {
      items: demoBlocks,
      editable: true,
      spacingClass: 'ui:gap-10',
      addChoices,
      addLabel: 'Add content',
      emptyTitle: 'No content yet',
      emptyDescription: 'Add a note, video, slides, document or image to get started.',
      previewLabel: 'Preview',
      dragHintLabel: 'Drag blocks to reorder them',
      dismissHintLabel: 'Dismiss hint',
      ...railLabels
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      emptyIcon: { control: false },
      emptyAction: { control: false },
      renderItem: { control: false },
      onAdd: { control: false },
      onReorder: { control: false },
      itemTitle: { control: false },
      goToBlockLabel: { control: false }
    },
    tags: ['autodocs']
  });
</script>

{#snippet blockBody(block: DemoBlock)}
  <div class="flex flex-col gap-1.5">
    <p class="ui:text-foreground text-sm font-medium">{block.title}</p>
    <p class="ui:text-muted-foreground text-sm">{block.body}</p>
  </div>
{/snippet}

<Story name="EditMode">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List
        {...args}
        items={demoBlocks}
        editable={true}
        onAdd={(type, index) => console.log('add', type, 'at', index)}
        onReorder={(items: DemoBlock[]) =>
          console.log(
            'reorder',
            items.map((item) => item.id)
          )}
      >
        {#snippet renderItem({
          item,
          index,
          total,
          highlighted
        }: {
          item: DemoBlock;
          index: number;
          total: number;
          highlighted: boolean;
        })}
          <Block.Shell
            blockId={item.id}
            label={item.label}
            badge={item.badge}
            editable={true}
            {highlighted}
            dragLabel="Drag to reorder"
            actionsLabel="Block actions"
          >
            {@render blockBody(item)}
          </Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="ViewComfortable">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={demoBlocks} editable={false} spacingClass="ui:gap-10">
        {#snippet renderItem({ item }: { item: DemoBlock; index: number; total: number; highlighted: boolean })}
          <Block.Shell blockId={item.id} label={item.label}>
            {@render blockBody(item)}
          </Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="ViewCompact">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={demoBlocks} editable={false} spacingClass="ui:gap-6">
        {#snippet renderItem({ item }: { item: DemoBlock; index: number; total: number; highlighted: boolean })}
          <Block.Shell blockId={item.id} label={item.label}>
            {@render blockBody(item)}
          </Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="ViewSpacious">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={demoBlocks} editable={false} spacingClass="ui:gap-16">
        {#snippet renderItem({ item }: { item: DemoBlock; index: number; total: number; highlighted: boolean })}
          <Block.Shell blockId={item.id} label={item.label}>
            {@render blockBody(item)}
          </Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="EmptyEditable">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={[]} editable={true} emptyTitle="Add your first block">
        {#snippet emptyAction()}
          <AddBlock.Row
            choices={addChoices}
            addLabel="Add content"
            aiLabel="Ask AI"
            onSelect={(type) => console.log('add', type)}
          />
        {/snippet}

        {#snippet renderItem({ item }: { item: DemoBlock; index: number; total: number; highlighted: boolean })}
          <Block.Shell blockId={item.id} label={item.label}>{@render blockBody(item)}</Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="EmptyView">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={[]} editable={false} emptyTitle="No content" emptyDescription={undefined}>
        {#snippet renderItem({ item }: { item: DemoBlock; index: number; total: number; highlighted: boolean })}
          <Block.Shell blockId={item.id} label={item.label}>{@render blockBody(item)}</Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="Highlighted">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.List {...args} items={demoBlocks} editable={true} highlightId="checklist">
        {#snippet renderItem({
          item,
          index,
          total,
          highlighted
        }: {
          item: DemoBlock;
          index: number;
          total: number;
          highlighted: boolean;
        })}
          <Block.Shell
            blockId={item.id}
            label={item.label}
            editable={true}
            {highlighted}
            dragLabel="Drag to reorder"
            actionsLabel="Block actions"
          >
            {@render blockBody(item)}
          </Block.Shell>
        {/snippet}
      </Block.List>
    </div>
  {/snippet}
</Story>

<Story name="RailHidden">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-sm">
      <p class="text-muted-foreground mb-4 text-sm">
        Used beside a density control: no scroll rail, and the spacing is swapped live.
      </p>
      <div class="ui:bg-muted/40 w-full rounded-lg border p-3">
        <Block.List {...args} items={demoBlocks.slice(0, 3)} editable={false} showRail={false} spacingClass="ui:gap-6">
          {#snippet renderItem()}
            <div class="ui:bg-card flex flex-col gap-2 rounded-md border p-3">
              <div class="ui:bg-muted h-2 w-1/3 rounded-full"></div>
              <div class="ui:bg-muted h-1.5 w-full rounded-full"></div>
            </div>
          {/snippet}
        </Block.List>
      </div>
    </div>
  {/snippet}
</Story>
