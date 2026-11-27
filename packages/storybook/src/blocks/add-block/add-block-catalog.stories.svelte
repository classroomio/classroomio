<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AudioLinesIcon from '@lucide/svelte/icons/audio-lines';
  import CodeIcon from '@lucide/svelte/icons/code';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { CATALOG_CHOICES } from './choices';
  import { FIELDS } from './catalog-fields';

  const UPCOMING = [
    {
      type: 'upcoming_audio',
      label: 'Audio',
      description: 'Podcast or voice note',
      group: 'Media',
      icon: AudioLinesIcon,
      comingSoon: true
    },
    {
      type: 'upcoming_code',
      label: 'Code',
      description: 'A syntax-highlighted snippet',
      group: 'Advanced',
      icon: CodeIcon,
      comingSoon: true
    }
  ];

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Catalog',
    component: AddBlock.Catalog,
    args: {
      choices: [...CATALOG_CHOICES, ...UPCOMING],
      label: 'All blocks',
      searchLabel: 'Search blocks',
      noResultsLabel: 'No blocks match',
      newLabel: 'New',
      comingSoonLabel: 'Coming soon'
    },
    parameters: {
      layout: 'padded',
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

<script lang="ts">
  let lastSelection = $state('none');
</script>

<Story name="Grouped">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-[560px]">
      <p class="text-muted-foreground mb-4 text-sm">Last selection: {lastSelection}</p>
      <AddBlock.Catalog {...args} onSelect={(type) => (lastSelection = type)} />
    </div>
  {/snippet}
</Story>

<Story name="Ungrouped">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-[560px]">
      <AddBlock.Catalog {...args} choices={CATALOG_CHOICES.map(({ group, ...choice }) => choice)} onSelect={() => {}} />
    </div>
  {/snippet}
</Story>

<Story name="Narrow">
  {#snippet template(args)}
    <div class="w-[340px]">
      <AddBlock.Catalog {...args} onSelect={() => {}} />
    </div>
  {/snippet}
</Story>
