<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { TabsBlockAlignment, TabsBlockLabels, TabsBlockTab } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const LABELS: TabsBlockLabels = {
    tabList: 'Tabs',
    position: 'Tabs position',
    alignments: { left: 'Align tabs left', center: 'Align tabs center', right: 'Align tabs right' },
    tabName: 'Tab name',
    untitledTab: 'Untitled tab',
    notePlaceholder: 'Write a note for this tab…',
    addTab: 'Add tab',
    removeTab: 'Remove tab'
  };

  const TABS: TabsBlockTab[] = [
    { id: 'overview', name: 'Overview', note: 'A quick overview of what this section covers.' },
    { id: 'setup', name: 'Setup', note: 'What learners need in place before they start.' },
    { id: 'advanced', name: 'Advanced', note: 'Go deeper once the basics are comfortable.' }
  ];

  const MANY_TABS: TabsBlockTab[] = Array.from({ length: 10 }, (_, index) => ({
    id: `tab-${index + 1}`,
    name: `Module ${index + 1}`,
    note: ''
  }));

  const { Story } = defineMeta({
    title: 'Blocks/TabsBlock',
    component: Block.Tabs,
    args: {
      tabs: TABS,
      align: 'center',
      editable: false,
      maxTabs: 10,
      labels: LABELS
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      align: { control: 'inline-radio', options: ['left', 'center', 'right'] },
      content: { control: false },
      onNameInput: { control: false },
      onNoteInput: { control: false },
      onAddTab: { control: false },
      onRemoveTab: { control: false },
      onAlignChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let editTabs = $state([...TABS]);
  let editAlign = $state<TabsBlockAlignment>('center');
  let nextTabNumber = 1;

  function updateTab(tabId: string, changes: Partial<TabsBlockTab>) {
    editTabs = editTabs.map((tab) => (tab.id === tabId ? { ...tab, ...changes } : tab));
  }

  function addTab() {
    editTabs = [...editTabs, { id: `new-${nextTabNumber}`, name: 'New tab', note: '' }];
    nextTabNumber += 1;
  }
</script>

{#snippet sampleContent(tabId: string)}
  <div class="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
    The image or video of “{tabId}”
  </div>
{/snippet}

<Story name="Learner">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerLeftAligned">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} align="left" content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerRightAligned">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} align="right" content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="LearnerWithoutNotes">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} tabs={TABS.map((tab) => ({ ...tab, note: '' }))} content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs
        {...args}
        editable
        tabs={editTabs}
        align={editAlign}
        content={sampleContent}
        onNameInput={(tabId, name) => updateTab(tabId, { name })}
        onNoteInput={(tabId, note) => updateTab(tabId, { note })}
        onAddTab={addTab}
        onRemoveTab={(tabId) => (editTabs = editTabs.filter((tab) => tab.id !== tabId))}
        onAlignChange={(align) => (editAlign = align)}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditSingleTab">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} editable tabs={TABS.slice(0, 1)} content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="EditUntitledTab">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs
        {...args}
        editable
        tabs={[{ id: 'empty', name: '', note: '' }, ...TABS.slice(1)]}
        content={sampleContent}
      />
    </div>
  {/snippet}
</Story>

<Story name="EditAtMaximumTabs">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-3xl">
      <Block.Tabs {...args} editable tabs={MANY_TABS} content={sampleContent} />
    </div>
  {/snippet}
</Story>

<Story name="Narrow">
  {#snippet template(args)}
    <div class="w-[360px]">
      <Block.Tabs {...args} editable content={sampleContent} />
    </div>
  {/snippet}
</Story>
