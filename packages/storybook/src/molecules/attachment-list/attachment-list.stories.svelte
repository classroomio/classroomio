<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { AttachmentList } from '@cio/ui';

  const sampleFiles = [
    {
      id: 'pm-interview-guide',
      name: 'PM Interview Guide.pdf',
      size: 7844,
      type: 'pdf'
    },
    {
      id: 'product-roadmap-template',
      name: 'Product Roadmap Template.docx',
      size: 24576,
      type: 'docx'
    }
  ];

  const viewLabels = {
    title: 'Attachments',
    fileCount: '2 files',
    view: 'View file',
    download: 'Download file',
    delete: 'Delete file',
    reorder: 'Reorder file'
  };

  const { Story } = defineMeta({
    title: 'Molecules/AttachmentList',
    component: AttachmentList,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="ViewMode" parameters={{ layout: 'padded' }}>
  <div class="w-full max-w-xl">
    <AttachmentList
      mode="view"
      files={sampleFiles}
      labels={viewLabels}
      onView={(file) => console.log('view', file.name)}
      onDownload={(file) => console.log('download', file.name)}
    />
  </div>
</Story>

<Story name="EditMode" parameters={{ layout: 'padded' }}>
  <div class="w-full max-w-xl">
    <AttachmentList
      mode="edit"
      files={sampleFiles}
      labels={viewLabels}
      onView={(file) => console.log('view', file.name)}
      onDelete={(file) => console.log('delete', file.name)}
      onReorder={(files) =>
        console.log(
          'reorder',
          files.map((file) => file.name)
        )}
    />
  </div>
</Story>

<Story name="SingleFile" parameters={{ layout: 'padded' }}>
  <div class="w-full max-w-xl">
    <AttachmentList
      mode="view"
      files={[sampleFiles[0]]}
      labels={{
        ...viewLabels,
        fileCount: '1 file'
      }}
      onView={(file) => console.log('view', file.name)}
      onDownload={(file) => console.log('download', file.name)}
    />
  </div>
</Story>
