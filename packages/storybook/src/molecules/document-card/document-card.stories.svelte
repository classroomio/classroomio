<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { DocumentCard } from '@cio/ui';

  const { Story } = defineMeta({
    title: 'Molecules/DocumentCard',
    component: DocumentCard,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<Story name="WithViewAndDownload">
  <DocumentCard
    title="report.pdf"
    subtitle="PDF · 2.4 MB"
    fileUrl="https://example.com/report.pdf"
    viewLabel="View"
    downloadLabel="Download"
  />
</Story>

<Story name="WithoutUrl">
  <DocumentCard title="draft.docx" subtitle="DOCX · 156 KB" />
</Story>

<Story name="WithCustomActions">
  <DocumentCard title="lesson-doc.pdf" subtitle="PDF · 1.2 MB">
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
</Story>
