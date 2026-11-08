<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import type { AttachmentListFile } from '@cio/ui';
  import type { BlockDocumentLabels } from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const pdfFile: AttachmentListFile = {
    id: 'technical-guide',
    name: 'BC Ecommerce Fulfillment Technical Guide.pdf',
    size: 469800,
    type: 'application/pdf'
  };

  const docxFile: AttachmentListFile = {
    id: 'onboarding',
    name: 'Onboarding Checklist.docx',
    size: 24576,
    type: 'docx'
  };

  const longNameFile: AttachmentListFile = {
    id: 'proposal',
    name: 'ClassroomIO-Proposal-Pacific-Global-Solutions-Final-Revision-November-2026.pdf',
    size: 51917,
    type: 'pdf'
  };

  const unknownFile: AttachmentListFile = { id: 'archive', name: 'Course assets.zip' };

  const labels: BlockDocumentLabels = {
    view: 'View file',
    download: 'Download'
  };

  const { Story } = defineMeta({
    title: 'Blocks/DocumentBlock',
    component: Block.Document,
    args: {
      file: pdfFile,
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
      />
    </div>
  {/snippet}
</Story>

<Story name="FileTypes">
  {#snippet template(args)}
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {#each [pdfFile, docxFile, unknownFile] as file (file.id)}
        <Block.Document
          {...args}
          {file}
          editable={false}
          onView={(viewed) => console.log('view', viewed.name)}
          onDownload={(downloaded) => console.log('download', downloaded.name)}
        />
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="LongFileName">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-md">
      <Block.Document
        {...args}
        file={longNameFile}
        editable={false}
        onView={(file) => console.log('view', file.name)}
        onDownload={(file) => console.log('download', file.name)}
      />
    </div>
  {/snippet}
</Story>

<Story name="ReadOnly">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Document {...args} editable={false} />
    </div>
  {/snippet}
</Story>
