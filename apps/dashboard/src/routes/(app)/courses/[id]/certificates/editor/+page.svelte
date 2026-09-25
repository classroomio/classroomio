<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { Spinner } from '@cio/ui/base/spinner';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
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

  const courseId = $derived(page.params.id ?? '');

  $effect(() => {
    if (!courseId || !$profile.id) return;
    courseApi.ensureCourse(courseId, $profile.id);
  });

  const course = $derived(courseApi.course);
  const isReady = $derived(course?.id === courseId);

  const initialDesign: CertificateDesign = $derived(resolveCertificateDesign(course?.certificate));

  async function handleSave(design: CertificateDesign): Promise<boolean> {
    if (!courseId || !course) return false;

    const certificate = {
      ...(course.certificate ?? {}),
      design,
      theme: design.templateId
    };

    const updated = await courseApi.update(courseId, { certificate }, { showSuccessToast: false });
    return Boolean(updated);
  }

  function buildPreviewBody() {
    return {
      studentName: $profile.fullname || 'Preview Recipient',
      studentId: $profile.id || undefined,
      issuedAt: new Date().toISOString(),
      previewMode: true
    } as const;
  }

  async function handleDownloadPdf() {
    if (!courseId) return;

    try {
      const body = buildPreviewBody();
      await downloadCertificateFile(
        () =>
          classroomio.course[':courseId']['download']['certificate']['$post']({
            param: { courseId },
            json: body
          }),
        `${slugifyForFilename(course?.title || 'certificate')}.pdf`,
        'application/pdf'
      );
    } catch (error) {
      console.error('Preview PDF error', error);
      showCertificatePreviewError();
    }
  }

  async function handleDownloadPng() {
    if (!courseId) return;

    try {
      const body = buildPreviewBody();
      await downloadCertificateFile(
        () =>
          classroomio.course[':courseId']['download']['certificate']['png']['$post']({
            param: { courseId },
            json: body
          }),
        `${slugifyForFilename(course?.title || 'certificate')}.png`,
        'image/png'
      );
    } catch (error) {
      console.error('Preview PNG error', error);
      showCertificatePreviewError();
    }
  }

  async function handlePrint() {
    if (!courseId) return;

    try {
      const body = buildPreviewBody();
      await printCertificateFile(
        () =>
          classroomio.course[':courseId']['download']['certificate']['png']['$post']({
            param: { courseId },
            json: body
          }),
        course?.title ?? 'Certificate'
      );
    } catch (error) {
      console.error('Preview print error', error);
      showCertificatePreviewError();
    }
  }
</script>

<svelte:head>
  <title>{course?.title ?? $t('certificate.editor.title')}</title>
</svelte:head>

<div class="ui:bg-background min-h-screen w-full">
  {#if isReady && course}
    <CertificateEditorModal
      title={course.title}
      description={course.description || ''}
      backHref={resolve('/courses/[id]/certificates', { id: courseId })}
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
