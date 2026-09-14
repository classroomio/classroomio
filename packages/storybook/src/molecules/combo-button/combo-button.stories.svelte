<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ComboButton, type ComboButtonItem } from '@cio/ui/custom/combo-button';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import CodeIcon from '@lucide/svelte/icons/code';
  import Trash2Icon from '@lucide/svelte/icons/trash-2';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ComboButton',
    component: ComboButton,
    parameters: {
      layout: 'centered',
      controls: { include: FIELDS }
    },
    argTypes: {
      onSelect: { control: false },
      items: { control: false },
      icon: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let lastAction = $state('none');

  const exportItems: ComboButtonItem[] = [
    {
      id: 'pdf',
      label: 'Export as PDF',
      icon: FileTextIcon,
      onSelect: () => (lastAction = 'pdf')
    },
    {
      id: 'excel',
      label: 'Export as Excel',
      icon: FileSpreadsheetIcon,
      onSelect: () => (lastAction = 'excel')
    },
    {
      id: 'html',
      label: 'Export as HTML',
      icon: CodeIcon,
      onSelect: () => (lastAction = 'html')
    }
  ];

  const withDisabledItem: ComboButtonItem[] = [
    { id: 'excel', label: 'Export as Excel', icon: FileSpreadsheetIcon, onSelect: () => {} },
    {
      id: 'pdf',
      label: 'Export as PDF',
      icon: FileTextIcon,
      description: 'Too many rows — use CSV above 2,000',
      disabled: true,
      onSelect: () => {}
    }
  ];

  const withDestructiveItem: ComboButtonItem[] = [
    { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
    { id: 'delete', label: 'Delete permanently', icon: Trash2Icon, destructive: true, onSelect: () => {} }
  ];
</script>

<Story name="Default">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    onSelect={() => (lastAction = 'csv')}
  />
  <p class="mt-4 text-sm">Last action: {lastAction}</p>
</Story>

<Story name="Without a primary icon">
  <ComboButton label="Export as CSV" menuLabel="More export formats" items={exportItems} onSelect={() => {}} />
</Story>

<Story name="Loading">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    loading
    onSelect={() => {}}
  />
</Story>

<Story name="Disabled">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    disabled
    onSelect={() => {}}
  />
</Story>

<Story name="With a disabled item and reason">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={withDisabledItem}
    onSelect={() => {}}
  />
</Story>

<Story name="With a destructive item">
  <ComboButton label="Save" menuLabel="More actions" items={withDestructiveItem} onSelect={() => {}} />
</Story>

<Story name="Primary variant">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    variant="default"
    onSelect={() => {}}
  />
</Story>

<Story name="Large">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    size="lg"
    onSelect={() => {}}
  />
</Story>

<Story name="Menu aligned to start">
  <ComboButton
    label="Export as CSV"
    menuLabel="More export formats"
    icon={DownloadIcon}
    items={exportItems}
    align="start"
    onSelect={() => {}}
  />
</Story>
