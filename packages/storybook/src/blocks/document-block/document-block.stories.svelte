<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { AttachmentListFile, AttachmentListLabels } from '@cio/ui';
  import { FIELDS } from './fields';

  const sampleFiles: AttachmentListFile[] = [
    { id: 'setup-guide', name: 'Product Setup Guide.pdf', size: 880640, type: 'pdf' },
    { id: 'onboarding', name: 'Onboarding Checklist.docx', size: 24576, type: 'docx' }
  ];

  const singleFile: AttachmentListFile[] = [sampleFiles[0]];

  const labels: AttachmentListLabels = {
    title: 'Attachments',
    fileCount: '2 files',
    view: 'View file',
    download: 'Download file',
    delete: 'Delete file',
    reorder: 'Reorder file'
  };

  const { Story } = defineMeta({
    title: 'Blocks/DocumentBlock',
    component: Block.Document,
    args: {
      files: sampleFiles,
      editable: false,
      changeLabel: 'Change document',
      labels
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onView: { control: false },
      onDownload: { control: false },
      onChange: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Document
        {...args}
        editable={false}
        onView={(file) => console.log('view', file.name)}
        onDownload={(file) => console.log('download', file.name)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Document
        {...args}
        editable={true}
        onChange={() => console.log('change document')}
        onView={(file) => console.log('view', file.name)}
        onDownload={(file) => console.log('download', file.name)}
      />
    </div>
  {/snippet}
</Story>

<Story name="SingleFile">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Document {...args} files={singleFile} labels={{ ...labels, fileCount: '1 file' }} editable={false} />
    </div>
  {/snippet}
</Story>
