<script lang="ts" generics="Row">
  import CodeIcon from '@lucide/svelte/icons/code';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { ComboButton, type ComboButtonItem } from '@cio/ui/custom/combo-button';
  import { PDF_EXPORT_ROW_LIMIT, type ExportDocument } from '@cio/utils/export';
  import { type ExportFormat, downloadExport } from './export-renderers';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    /**
     * The document, or a loader for it. Pass a loader when the rows are not on
     * the page — the roster pulls the full set on demand rather than holding it
     * in memory for an export that may never happen.
     */
    document: ExportDocument<Row> | (() => Promise<ExportDocument<Row>>);
    /** Used to decide whether PDF is offered, when known before loading. */
    estimatedRowCount?: number;
    disabled?: boolean;
    testId?: string;
  }

  let { document: documentOrLoader, estimatedRowCount, disabled = false, testId = 'export' }: Props = $props();

  let isExporting = $state(false);

  const pdfDisabled = $derived(estimatedRowCount != null && estimatedRowCount > PDF_EXPORT_ROW_LIMIT);

  async function runExport(format: ExportFormat) {
    if (isExporting) return;

    isExporting = true;

    try {
      const doc = typeof documentOrLoader === 'function' ? await documentOrLoader() : documentOrLoader;

      if (doc.rows.length === 0) {
        snackbar.error('export.nothing_to_export');
        return;
      }

      await downloadExport(doc, format);
    } catch (error) {
      console.error('export failed:', error);
      snackbar.error('export.failed');
    } finally {
      isExporting = false;
    }
  }

  const items = $derived<ComboButtonItem[]>([
    {
      id: 'xlsx',
      label: $t('export.as_excel'),
      icon: FileSpreadsheetIcon,
      onSelect: () => runExport('xlsx')
    },
    {
      id: 'pdf',
      label: $t('export.as_pdf'),
      icon: FileTextIcon,
      // Disabled with a reason rather than hidden, so the menu keeps its shape.
      disabled: pdfDisabled,
      description: pdfDisabled ? $t('export.pdf_too_many_rows', { limit: PDF_EXPORT_ROW_LIMIT }) : undefined,
      onSelect: () => runExport('pdf')
    },
    {
      id: 'html',
      label: $t('export.as_html'),
      icon: CodeIcon,
      onSelect: () => runExport('html')
    }
  ]);
</script>

<ComboButton
  label={$t('export.as_csv')}
  menuLabel={$t('export.more_formats')}
  icon={DownloadIcon}
  {items}
  {disabled}
  loading={isExporting}
  {testId}
  onSelect={() => runExport('csv')}
/>
