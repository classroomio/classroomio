<script lang="ts" generics="Row">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import { Button } from '@cio/ui/base/button';
  import { PDF_EXPORT_ROW_LIMIT, type ExportDocument } from '@cio/utils/export';
  import { downloadCsv, downloadPdf } from './export-renderers';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    /**
     * The document, or a loader for it. Pass a loader when the rows are not on
     * the page — a roster export pulls the full set on demand rather than
     * holding tens of thousands of rows in memory just in case.
     */
    document: ExportDocument<Row> | (() => Promise<ExportDocument<Row>>);
    /** Row count used to decide whether PDF is offered, when known up front. */
    estimatedRowCount?: number;
    disabled?: boolean;
    testId?: string;
  }

  let { document: documentOrLoader, estimatedRowCount, disabled = false, testId = 'export-menu' }: Props = $props();

  let isExporting = $state(false);

  const pdfDisabled = $derived(estimatedRowCount != null && estimatedRowCount > PDF_EXPORT_ROW_LIMIT);

  async function resolveDocument(): Promise<ExportDocument<Row>> {
    return typeof documentOrLoader === 'function' ? documentOrLoader() : documentOrLoader;
  }

  async function runExport(format: 'csv' | 'pdf') {
    if (isExporting) return;

    isExporting = true;

    try {
      const doc = await resolveDocument();

      if (doc.rows.length === 0) {
        snackbar.error('export.nothing_to_export');
        return;
      }

      if (format === 'csv') {
        downloadCsv(doc);
      } else {
        await downloadPdf(doc);
      }
    } catch (error) {
      console.error('export failed:', error);
      snackbar.error('export.failed');
    } finally {
      isExporting = false;
    }
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        testId={`${testId}-trigger`}
        variant="outline"
        size="sm"
        loading={isExporting}
        disabled={disabled || isExporting}
      >
        <DownloadIcon class="size-4" aria-hidden="true" />
        {$t('audience.export')}
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-56">
    <DropdownMenu.Item onSelect={() => runExport('csv')}>{$t('export.csv')}</DropdownMenu.Item>
    <DropdownMenu.Item disabled={pdfDisabled} onSelect={() => runExport('pdf')}>
      <span class="flex flex-col">
        <span>{$t('export.pdf')}</span>
        {#if pdfDisabled}
          <!-- Say why rather than leaving a dead menu item. -->
          <span class="ui:text-muted-foreground text-xs">
            {$t('export.pdf_too_many_rows', { limit: PDF_EXPORT_ROW_LIMIT })}
          </span>
        {/if}
      </span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
