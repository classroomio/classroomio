<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { SlideBlock } from '@cio/ui';
  import type { SlideEmbed } from '@cio/utils/functions';
  import { FIELDS } from './fields';

  const sampleSlide: SlideEmbed = {
    id: 'sample-google-slides',
    src: 'https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview',
    platform: 'google-slides'
  };

  const { Story } = defineMeta({
    title: 'Blocks/SlideBlock',
    component: SlideBlock,
    args: {
      slide: sampleSlide,
      isExample: false,
      editable: false,
      frameTitle: 'Google Slides deck',
      changeLabel: 'Change slide',
      sampleUpdated: 'Updated Oct 2026'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <SlideBlock {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <SlideBlock {...args} editable={true} onChange={() => console.log('change slide')} />
    </div>
  {/snippet}
</Story>

<Story name="ChangeAction">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <SlideBlock {...args} editable={true} changeLabel="Change slide" onChange={() => console.log('change slide')} />
    </div>
  {/snippet}
</Story>

<Story name="Example">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <SlideBlock
        {...args}
        slide={undefined}
        isExample={true}
        editable={true}
        onChange={() => console.log('change slide')}
      />
    </div>
  {/snippet}
</Story>
