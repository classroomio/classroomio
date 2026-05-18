<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PrinterIcon from '@lucide/svelte/icons/printer';
  import { t } from '$lib/utils/functions/translations';
  import { classroomio } from '$lib/utils/services/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    courseId: string;
    courseTitle: string;
    disabled?: boolean;
  }

  let { courseId, courseTitle, disabled = false }: Props = $props();

  let isPdfLoading = $state(false);
  let isPngLoading = $state(false);
  let isPrintLoading = $state(false);

  const downloadName = $derived((courseTitle || 'certificate').replace(/\s+/g, '-').toLowerCase());

  async function buildBody() {
    return {
      studentName: $profile.fullname || 'Preview Recipient',
      studentId: $profile.id || undefined,
      issuedAt: new Date().toISOString(),
      previewMode: true
    } as const;
  }

  async function downloadPdf() {
    if (disabled || isPdfLoading) return;
    isPdfLoading = true;

    try {
      const body = await buildBody();
      const response = await classroomio.course[':courseId']['download']['certificate']['$post']({
        param: { courseId },
        json: body
      });
      const blob = await response.blob();
      triggerDownload(new Blob([blob], { type: 'application/pdf' }), `${downloadName}.pdf`);
    } catch (error) {
      console.error('Preview PDF error', error);
      snackbar.error('course.navItem.certificates.editor.preview_failed');
    } finally {
      isPdfLoading = false;
    }
  }

  async function downloadPng() {
    if (disabled || isPngLoading) return;
    isPngLoading = true;

    try {
      const body = await buildBody();
      const response = await classroomio.course[':courseId']['download']['certificate']['png']['$post']({
        param: { courseId },
        json: body
      });
      const blob = await response.blob();
      triggerDownload(new Blob([blob], { type: 'image/png' }), `${downloadName}.png`);
    } catch (error) {
      console.error('Preview PNG error', error);
      snackbar.error('course.navItem.certificates.editor.preview_failed');
    } finally {
      isPngLoading = false;
    }
  }

  async function print() {
    if (disabled || isPrintLoading) return;
    isPrintLoading = true;

    try {
      const body = await buildBody();
      const response = await classroomio.course[':courseId']['download']['certificate']['png']['$post']({
        param: { courseId },
        json: body
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(
          `<!doctype html><html><head><title>${courseTitle}</title>` +
            `<style>@page{size:A4 landscape;margin:0}body{margin:0;display:flex;align-items:center;justify-content:center;background:#fff}img{width:100vw;max-width:1100px;height:auto}</style>` +
            `</head><body><img alt="" src="${url}" onload="setTimeout(()=>window.print(),300)"></body></html>`
        );
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Preview print error', error);
      snackbar.error('course.navItem.certificates.editor.preview_failed');
    } finally {
      isPrintLoading = false;
    }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
</script>

<div class="space-y-2">
  <Button class="w-full justify-start" {disabled} loading={isPdfLoading} onclick={downloadPdf}>
    <DownloadIcon class="size-4" />
    {$t('course.navItem.certificates.editor.download_pdf')}
  </Button>
  <Button variant="outline" class="w-full justify-start" {disabled} loading={isPngLoading} onclick={downloadPng}>
    <ImageIcon class="size-4" />
    {$t('course.navItem.certificates.editor.download_png')}
  </Button>
  <Button variant="outline" class="w-full justify-start" {disabled} loading={isPrintLoading} onclick={print}>
    <PrinterIcon class="size-4" />
    {$t('course.navItem.certificates.editor.print')}
  </Button>

  <p class="ui:text-muted-foreground mt-3 text-xs">
    {$t('course.navItem.certificates.editor.export_hint')}
  </p>
</div>
