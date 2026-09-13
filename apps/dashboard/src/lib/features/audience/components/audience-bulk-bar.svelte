<script lang="ts" generics="Row">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Page from '@cio/ui/base/page';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ClipboardIcon from '@lucide/svelte/icons/clipboard';
  import CodeIcon from '@lucide/svelte/icons/code';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import BracesIcon from '@lucide/svelte/icons/braces';
  import { Button } from '@cio/ui/base/button';
  import { PDF_EXPORT_ROW_LIMIT, type ExportDocument } from '@cio/utils/export';
  import { type CopyFormat, type ExportFormat, copyExport, downloadExport } from '$features/ui/export/export-renderers';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import type { AudienceBulkAction } from '$features/org/utils/types';

  interface Props {
    selectedCount: number;
    /** Total matching the current filters — the ceiling for "select all matching". */
    totalMatching: number;
    /** True once the admin escalated from tick-boxes to the whole filtered set. */
    allMatchingSelected: boolean;
    isApplying?: boolean;
    /** Loads the rows for the current selection, shared by Copy and Export. */
    document: () => Promise<ExportDocument<Row>>;
    onSelectAllMatching: () => void;
    onClearSelection: () => void;
    onOpenAssign: () => void;
    onAction: (action: AudienceBulkAction) => void;
  }

  let {
    selectedCount,
    totalMatching,
    allMatchingSelected,
    isApplying = false,
    document: loadDocument,
    onSelectAllMatching,
    onClearSelection,
    onOpenAssign,
    onAction
  }: Props = $props();

  const effectiveCount = $derived(allMatchingSelected ? totalMatching : selectedCount);
  // Only worth offering when it would actually widen the selection.
  const canSelectAllMatching = $derived(!allMatchingSelected && totalMatching > selectedCount);
  const pdfDisabled = $derived(effectiveCount > PDF_EXPORT_ROW_LIMIT);

  let isBusy = $state(false);

  // Archive leads: it is reversible, it frees a seat, and it is the right answer
  // to almost every "remove them" instinct. Delete sits last and apart.
  const actions: AudienceBulkAction[] = ['archive', 'deactivate', 'reactivate', 'unarchive'];

  /** Both menus load the same document; only the destination differs. */
  async function withDocument(run: (doc: ExportDocument<Row>) => Promise<void> | void, failureKey: string) {
    if (isBusy) return;

    isBusy = true;

    try {
      const doc = await loadDocument();

      if (doc.rows.length === 0) {
        snackbar.error('export.nothing_to_export');
        return;
      }

      await run(doc);
    } catch (error) {
      console.error(failureKey, error);
      snackbar.error(failureKey);
    } finally {
      isBusy = false;
    }
  }

  const copyFormats = $derived<{ id: CopyFormat; label: string; icon: typeof CodeIcon }[]>([
    { id: 'csv', label: $t('export.format_csv'), icon: FileSpreadsheetIcon },
    { id: 'json', label: $t('export.format_json'), icon: BracesIcon },
    { id: 'html', label: $t('export.format_html'), icon: CodeIcon }
  ]);

  const exportFormats = $derived<
    { id: ExportFormat; label: string; icon: typeof CodeIcon; disabled?: boolean; hint?: string }[]
  >([
    { id: 'csv', label: $t('export.format_csv'), icon: FileSpreadsheetIcon },
    { id: 'xlsx', label: $t('export.format_excel'), icon: FileSpreadsheetIcon },
    {
      id: 'pdf',
      label: $t('export.format_pdf'),
      icon: FileTextIcon,
      // Disabled with a reason rather than hidden, so the menu keeps its shape.
      disabled: pdfDisabled,
      hint: pdfDisabled ? $t('export.pdf_too_many_rows', { limit: PDF_EXPORT_ROW_LIMIT }) : undefined
    },
    { id: 'html', label: $t('export.format_html'), icon: CodeIcon }
  ]);
</script>

<Page.FloatingBar
  show={effectiveCount > 0}
  status={allMatchingSelected
    ? $t('audience.bulk.all_matching_selected', { count: totalMatching })
    : $t('audience.selected_count', { count: selectedCount })}
  data-testid="audience-bulk-bar"
>
  {#if canSelectAllMatching}
    <Button
      testId="audience-bulk-select-all-matching"
      variant="secondary"
      size="sm"
      class="ui:bg-background ui:text-foreground ui:hover:bg-background/80"
      onclick={onSelectAllMatching}
      disabled={isApplying}
    >
      {$t('audience.bulk.select_all_matching', { count: totalMatching })}
    </Button>
  {/if}

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          testId="audience-bulk-copy"
          variant="secondary"
          size="sm"
          class="ui:bg-background ui:text-foreground ui:hover:bg-background/80"
          disabled={isApplying || isBusy}
        >
          <ClipboardIcon class="size-4" aria-hidden="true" />
          {$t('export.copy')}
          <ChevronDownIcon class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-48">
      {#each copyFormats as format (format.id)}
        <DropdownMenu.Item
          onSelect={() =>
            withDocument(async (doc) => {
              await copyExport(doc, format.id);
              snackbar.success('export.copied');
            }, 'export.copy_failed')}
        >
          <format.icon class="size-4" aria-hidden="true" />
          {format.label}
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          testId="audience-bulk-export"
          variant="secondary"
          size="sm"
          class="ui:bg-background ui:text-foreground ui:hover:bg-background/80"
          disabled={isApplying || isBusy}
        >
          <DownloadIcon class="size-4" aria-hidden="true" />
          {$t('export.label')}
          <ChevronDownIcon class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-56">
      {#each exportFormats as format (format.id)}
        <DropdownMenu.Item
          disabled={format.disabled}
          onSelect={() => withDocument((doc) => downloadExport(doc, format.id), 'export.failed')}
        >
          <format.icon class="size-4" aria-hidden="true" />
          <span class="flex flex-col">
            <span>{format.label}</span>
            {#if format.hint}
              <span class="ui:text-muted-foreground text-xs">{format.hint}</span>
            {/if}
          </span>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} testId="audience-bulk-actions" variant="default" size="sm" disabled={isApplying}>
          {$t('audience.bulk.actions')}
          <ChevronDownIcon class="size-4" aria-hidden="true" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-52">
      <!-- Assigning is the one non-destructive action here, so it leads and is
           separated from the lifecycle changes below it. -->
      <DropdownMenu.Item disabled={allMatchingSelected} onSelect={onOpenAssign}>
        {$t('audience.assign_courses')}
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      {#each actions as action (action)}
        <DropdownMenu.Item onSelect={() => onAction(action)}>
          {$t(`audience.bulk.action.${action}`, { count: effectiveCount })}
        </DropdownMenu.Item>
      {/each}
      <DropdownMenu.Separator />
      <DropdownMenu.Item class="ui:text-destructive ui:focus:text-destructive" onSelect={() => onAction('delete')}>
        {$t('audience.bulk.action.delete', { count: effectiveCount })}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>

  <!-- Separated and quieter: clearing is the way out, not one of the actions. -->
  <span class="ui:bg-background/30 h-5 w-px shrink-0" aria-hidden="true"></span>
  <Button
    variant="link"
    size="sm"
    class="ui:text-background ui:hover:text-background h-auto p-0"
    onclick={onClearSelection}
    disabled={isApplying}
  >
    {$t('audience.bulk.clear')}
  </Button>
</Page.FloatingBar>
