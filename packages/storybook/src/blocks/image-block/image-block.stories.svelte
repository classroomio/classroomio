<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const SAMPLE_IMAGE = '/images/classroomio-course-img-template.jpg';

  const { Story } = defineMeta({
    title: 'Blocks/ImageBlock',
    component: Block.Image,
    args: {
      url: SAMPLE_IMAGE,
      alt: 'Two people reviewing a course together on a laptop',
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
