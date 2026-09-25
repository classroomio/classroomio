<script lang="ts">
  import { page } from '$app/state';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { learningPathApi } from '$features/learning-path/api';
  import { isFreePlan } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import {
    CertificateEditorModal,
    downloadCertificateFile,
    printCertificateFile,
    showCertificatePreviewError
  } from '$features/ui/certificate';
  import { slugifyForFilename } from '@cio/utils/functions';
  import { classroomio } from '$lib/utils/services/api';
  import { resolveCertificateDesign, type CertificateDesign } from '@cio/certificates';

  const publicId = $derived(page.params.publicId ?? '');

  $effect(() => {
    if (!publicId || !$profile.id) return;

    learningPathApi.ensurePath(publicId);
  });

  const path = $derived(learningPathApi.currentPath);
  const isReady = $derived(path?.publicId === publicId || path?.id === publicId);

  const initialDesign: CertificateDesign = $derived(resolveCertificateDesign(path?.certificate));

  async function handleSave(design: CertificateDesign): Promise<boolean> {
    if (!path?.publicId) return false;

    const certificate = {
      ...(path.certificate ?? {}),
      design,
      theme: design.templateId
    };

    const res = await learningPathApi.update(path.publicId, { certificate }, { showSuccessToast: false });

    return Boolean(res);
  }

  function buildPreviewBody() {
    return {
      studentName: $profile.fullname || 'Preview Recipient',
      previewMode: true
    } as const;
  }

  async function handleDownloadPdf() {
    if (!path?.id) return;

    try {
      const body = buildPreviewBody();
      await downloadCertificateFile(
        () =>
          classroomio['learning-path'][':pathId']['download']['certificate']['$post']({
            param: { pathId: path.id },
            json: body
          }),
        `${slugifyForFilename(path.name || 'certificate')}.pdf`,
        'application/pdf'
      );
    } catch (error) {
      console.error('Preview PDF error', error);
      showCertificatePreviewError();
    }
  }

  async function handleDownloadPng() {
    if (!path?.id) return;

    try {
      const body = buildPreviewBody();
      await downloadCertificateFile(
        () =>
          classroomio['learning-path'][':pathId']['download']['certificate']['png']['$post']({
            param: { pathId: path.id },
            json: body
          }),
        `${slugifyForFilename(path.name || 'certificate')}.png`,
        'image/png'
      );
    } catch (error) {
      console.error('Preview PNG error', error);
      showCertificatePreviewError();
    }
  }

  async function handlePrint() {
    if (!path?.id) return;

    try {
      const body = buildPreviewBody();
      await printCertificateFile(
        () =>
          classroomio['learning-path'][':pathId']['download']['certificate']['png']['$post']({
            param: { pathId: path.id },
            json: body
          }),
        path.name
      );
    } catch (error) {
      console.error('Preview print error', error);
      showCertificatePreviewError();
    }
  }
</script>

<svelte:head>
  <title>{path?.name ?? $t('learningPath.certificate.editor.title')}</title>
</svelte:head>

<div class="ui:bg-background min-h-screen w-full">
  {#if isReady && path}
    <CertificateEditorModal
      title={path.name}
      description={path.description}
      backHref={`/paths/${publicId}/certificates`}
      {initialDesign}
      onSave={handleSave}
      isFreePlan={$isFreePlan}
      onDownloadPdf={handleDownloadPdf}
      onDownloadPng={handleDownloadPng}
      onPrint={handlePrint}
    />
  {:else}
    <div class="flex min-h-[60vh] items-center justify-center">
      <Spinner class="size-8!" />
    </div>
  {/if}
</div>
