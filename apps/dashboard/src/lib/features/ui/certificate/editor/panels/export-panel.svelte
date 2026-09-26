<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PrinterIcon from '@lucide/svelte/icons/printer';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    disabled?: boolean;
    onDownloadPdf?: () => Promise<void>;
    onDownloadPng?: () => Promise<void>;
    onPrint?: () => Promise<void>;
  }

  let { disabled = false, onDownloadPdf, onDownloadPng, onPrint }: Props = $props();

  let isPdfLoading = $state(false);
  let isPngLoading = $state(false);
  let isPrintLoading = $state(false);

  async function handleDownloadPdf() {
    if (disabled || isPdfLoading || !onDownloadPdf) return;
    isPdfLoading = true;
    try {
      await onDownloadPdf();
    } finally {
      isPdfLoading = false;
    }
  }

  async function handleDownloadPng() {
    if (disabled || isPngLoading || !onDownloadPng) return;
    isPngLoading = true;
    try {
      await onDownloadPng();
    } finally {
      isPngLoading = false;
    }
  }

  async function handlePrint() {
    if (disabled || isPrintLoading || !onPrint) return;
    isPrintLoading = true;
    try {
      await onPrint();
    } finally {
      isPrintLoading = false;
    }
  }
</script>

<div class="space-y-2">
  <Button class="w-full justify-start" {disabled} loading={isPdfLoading} onclick={handleDownloadPdf}>
    <DownloadIcon class="size-4" />
    {$t('certificate.editor.download_pdf')}
  </Button>
  <Button variant="outline" class="w-full justify-start" {disabled} loading={isPngLoading} onclick={handleDownloadPng}>
    <ImageIcon class="size-4" />
    {$t('certificate.editor.download_png')}
  </Button>
  <Button variant="outline" class="w-full justify-start" {disabled} loading={isPrintLoading} onclick={handlePrint}>
    <PrinterIcon class="size-4" />
    {$t('certificate.editor.print')}
  </Button>

  <p class="ui:text-muted-foreground mt-3 text-xs">
    {$t('certificate.editor.export_hint')}
  </p>
</div>
