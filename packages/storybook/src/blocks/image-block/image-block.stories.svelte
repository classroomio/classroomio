<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const BRAND_COVERS = Object.entries(Block.BRAND_COVER_IMAGES);

  const { Story } = defineMeta({
    title: 'Blocks/ImageBlock',
    component: Block.Image,
    args: {
      url: Block.DEFAULT_IMAGE_BLOCK_IMAGE,
      alt: 'ClassroomIO logo on a blue background',
      fit: 'cover',
      editable: false
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onChange: { control: false },
      onSaveSettings: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Image {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Image {...args} editable={true} onChange={() => console.log('change image')} />
    </div>
  {/snippet}
</Story>

<Story name="ContainFit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Image {...args} fit="contain" editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Image {...args} url={undefined} editable={true} onChange={() => console.log('change image')} />
    </div>
  {/snippet}
</Story>

<Story name="BrokenImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Image {...args} url="/images/does-not-exist.png" editable={true} />
    </div>
  {/snippet}
</Story>

<Story name="BrandCovers">
  {#snippet template()}
    <div class="mx-auto grid w-full max-w-2xl gap-4">
      {#each BRAND_COVERS as [name, url] (name)}
        <Block.Image {url} alt={`ClassroomIO brand cover: ${name}`} editable={false} />
      {/each}
    </div>
  {/snippet}
</Story>
