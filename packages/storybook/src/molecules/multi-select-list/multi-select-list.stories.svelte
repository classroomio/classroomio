<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MultiSelectList } from '@cio/ui';
  import { SvelteSet } from 'svelte/reactivity';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MultiSelectList',
    component: MultiSelectList,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const sampleItems = [
    { id: 'a', label: 'Introduction' },
    { id: 'b', label: 'Core concepts' },
    { id: 'c', label: 'Practice set' }
  ];
</script>

<script lang="ts">
  let selected = new SvelteSet<string>();

  function toggle(id: string) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
  }
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <MultiSelectList
        heading="Select items"
        emptyMessage="No items to show."
        items={sampleItems}
        isSelected={(id) => selected.has(id)}
        onToggle={toggle}
        namePrefix="story-ms"
      />
      <p class="ui:mt-3 ui:text-muted-foreground ui:text-sm">Selected: {[...selected].join(', ') || 'none'}</p>
    </div>
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <MultiSelectList
        heading="Select items"
        emptyMessage="Nothing here yet."
        items={[]}
        isSelected={() => false}
        onToggle={() => {}}
      />
    </div>
  {/snippet}
</Story>
