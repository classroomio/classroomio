<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ImageBlock } from '@cio/ui';
  import { FIELDS } from './fields';

  const SAMPLE_IMAGE = '/images/classroomio-course-img-template.jpg';

  const { Story } = defineMeta({
    title: 'Blocks/ImageBlock',
    component: ImageBlock,
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
      onChangeFile: { control: false },
      onSaveSettings: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <ImageBlock {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <ImageBlock {...args} editable={true} onChangeFile={(file) => console.log('upload', file.name)} />
    </div>
  {/snippet}
</Story>

<Story name="ContainFit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <ImageBlock {...args} fit="contain" editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <ImageBlock {...args} url={undefined} editable={true} onChangeFile={(file) => console.log('upload', file.name)} />
    </div>
  {/snippet}
</Story>

<Story name="BrokenImage">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <ImageBlock {...args} url="/images/does-not-exist.png" editable={true} />
    </div>
  {/snippet}
</Story>
