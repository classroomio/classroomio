<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { BLOCK_PREVIEW_SCENES } from '@cio/ui/custom/add-block';
  import { CATALOG_CHOICES, UPCOMING_CHOICES } from './choices';
  import { FIELDS } from './preview-fields';

  const SCENES = Object.keys(BLOCK_PREVIEW_SCENES);

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Preview',
    component: AddBlock.PreviewScene,
    args: {
      scene: 'note'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      scene: { control: 'select', options: SCENES }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  const allChoices = [...CATALOG_CHOICES, ...UPCOMING_CHOICES];
  let lastSelection = $state('none');
</script>

<Story name="Scene">
  {#snippet template(args)}
    <div class="w-[340px] overflow-hidden rounded-xl border">
      <AddBlock.PreviewScene {...args} />
    </div>
  {/snippet}
</Story>

<Story name="AllScenes">
  {#snippet template()}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
      {#each SCENES as scene (scene)}
        <figure class="m-0 overflow-hidden rounded-xl border">
          <AddBlock.PreviewScene {scene} />
          <figcaption class="px-3 py-2 font-mono text-xs">{scene}</figcaption>
        </figure>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="HoverInAllBlocksDrawer">
  {#snippet template()}
    <div class="flex flex-col items-start gap-3">
      <p class="text-sm">Open All blocks and hover or focus a tile. Last selection: {lastSelection}</p>
      <AddBlock.CatalogSheet
        choices={allChoices}
        label="All blocks"
        newLabel="New"
        comingSoonLabel="Coming soon"
        onSelect={(type) => (lastSelection = type)}
      >
        {#snippet trigger({ toggle })}
          <button type="button" class="rounded-md border px-3 py-1.5 text-sm" onclick={toggle}>All blocks</button>
        {/snippet}
      </AddBlock.CatalogSheet>
    </div>
  {/snippet}
</Story>
