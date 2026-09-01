<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DocumentCard } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/DocumentCard',
    component: DocumentCard,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story
  name="WithViewAndDownload"
  args={{
    title: 'report.pdf',
    subtitle: 'PDF · 2.4 MB',
    fileUrl: 'https://example.com/report.pdf',
    viewLabel: 'View',
    downloadLabel: 'Download'
  }}
/>

<Story
  name="WithoutUrl"
  args={{
    title: 'draft.docx',
    subtitle: 'DOCX · 156 KB'
  }}
/>

<Story
  name="WithCustomActions"
  args={{
    title: 'lesson-doc.pdf',
    subtitle: 'PDF · 1.2 MB'
  }}
>
  {#snippet template(args)}
    <DocumentCard {...args}>
      {#snippet actions()}
        <button
          type="button"
          class="ui:border-input ui:bg-background ui:text-foreground ui:hover:bg-accent ui:hover:text-accent-foreground inline-flex shrink items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          View PDF
        </button>
        <button
          type="button"
          class="ui:border-input ui:bg-background ui:text-foreground ui:hover:bg-accent ui:hover:text-accent-foreground inline-flex shrink items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
        >
          Download
        </button>
      {/snippet}
    </DocumentCard>
  {/snippet}
</Story>
