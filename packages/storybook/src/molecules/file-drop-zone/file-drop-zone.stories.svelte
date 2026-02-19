<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import { FIELDS } from './fields';

  const MEGABYTE = FileDropZone.MEGABYTE;
  const ACCEPT_IMAGE = FileDropZone.ACCEPT_IMAGE;

  const { Story } = defineMeta({
    title: 'Molecules/FileDropZone',
    component: FileDropZone.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onUpload: {
        control: false,
        description: 'Called with the uploaded files when the user drops or selects files',
        table: {
          type: { summary: '(files: File[]) => Promise<void>' },
          defaultValue: { summary: 'undefined' }
        }
      },
      onFileRejected: {
        control: false,
        description: 'Called when a file does not meet the upload criteria',
        table: {
          type: { summary: '(opts: { reason: FileRejectedReason; file: File }) => void' },
          defaultValue: { summary: 'undefined' }
        }
      },
      maxFiles: {
        control: 'number',
        description: 'The maximum number of files allowed',
        table: { defaultValue: { summary: 'undefined' } }
      },
      maxFileSize: {
        control: 'number',
        description: 'The maximum file size in bytes',
        table: { defaultValue: { summary: 'undefined' } }
      },
      accept: {
        control: 'text',
        description: 'Comma-separated list of accepted file types',
        table: { defaultValue: { summary: 'undefined' } }
      }
    },
    tags: ['autodocs']
  });

  async function handleUpload(files) {
    console.log(
      'Uploaded files:',
      files.map((f) => f.name)
    );
  }

  function handleFileRejected(opts) {
    console.warn('File rejected:', opts.reason, opts.file.name);
  }
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <FileDropZone.Root onUpload={handleUpload} onFileRejected={handleFileRejected}>
        <FileDropZone.Trigger />
      </FileDropZone.Root>
    </div>
  {/snippet}
</Story>

<Story name="With Limits">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <FileDropZone.Root
        maxFiles={3}
        fileCount={0}
        maxFileSize={MEGABYTE * 5}
        onUpload={handleUpload}
        onFileRejected={handleFileRejected}
      >
        <FileDropZone.Trigger />
      </FileDropZone.Root>
    </div>
  {/snippet}
</Story>

<Story name="Images Only">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <FileDropZone.Root accept={ACCEPT_IMAGE} onUpload={handleUpload} onFileRejected={handleFileRejected}>
        <FileDropZone.Trigger />
      </FileDropZone.Root>
    </div>
  {/snippet}
</Story>

<Story name="With Textarea">
  {#snippet template()}
    <div class="ui:w-full ui:max-w-md">
      <FileDropZone.Root onUpload={handleUpload} onFileRejected={handleFileRejected}>
        <FileDropZone.Textarea
          placeholder="Paste or drag and drop files here to attach to your submission..."
          class="ui:min-h-24 ui:w-full ui:resize-none ui:rounded-md ui:border ui:border-input ui:bg-background ui:px-3 ui:py-2 ui:text-sm ui:ring-offset-background placeholder:ui:text-muted-foreground focus-visible:ui:outline-none focus-visible:ui:ring-2 focus-visible:ui:ring-ring focus-visible:ui:ring-offset-2"
        />
      </FileDropZone.Root>
    </div>
  {/snippet}
</Story>
