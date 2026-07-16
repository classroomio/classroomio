<script lang="ts">
  import { onMount } from 'svelte';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import ImageIcon from '@lucide/svelte/icons/image';

  import { profile } from '$lib/utils/store/user';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { classroomio } from '$lib/utils/services/api';
  import type { CertificationEvaluationData } from '$features/course/utils/types';
  import { normalizeCertificateIssuedAt, formatBlockerMessage } from '$features/course/utils/certificate-utils';
  import { updateCourseCompletionModal } from '$features/course/store/course-completion-modal';

  let isLoading = $state(false);
  let isPngLoading = $state(false);
  let isCourseComplete = $state(false);
  let evaluation = $state<CertificationEvaluationData | null>(null);

  let courseId = $derived(courseApi.course?.id ?? '');

  function buildBody() {
    return {
      studentName: $profile.fullname || 'Recipient',
      studentId: $profile.id || undefined,
      issuedAt: normalizeCertificateIssuedAt(evaluation?.certificateEarnedAt)
    } as const;
  }

  async function triggerSave(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    document.body.append(link);
    link.download = filename;
    link.href = url;
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const downLoadCertificate = async () => {
    if (!isCourseComplete || !courseId) return;

    isLoading = true;
    try {
      const response = await classroomio.course[':courseId']['download']['certificate']['$post']({
        param: { courseId },
        json: buildBody()
      });
      const blobResponse = await response.blob();
      await triggerSave(
        new Blob([blobResponse], { type: 'application/pdf' }),
        `certificate-${courseApi.course?.title ?? 'course'}.pdf`
      );
    } catch (error) {
      console.error('Error downloading', error);
      snackbar.error('course.navItem.certificates.unexpected_error');
    }

    isLoading = false;
  };

  const downloadCertificateImage = async () => {
    if (!isCourseComplete || !courseId) return;

    isPngLoading = true;
    try {
      const response = await classroomio.course[':courseId']['download']['certificate']['png']['$post']({
        param: { courseId },
        json: buildBody()
      });
      const blobResponse = await response.blob();
      await triggerSave(
        new Blob([blobResponse], { type: 'image/png' }),
        `certificate-${courseApi.course?.title ?? 'course'}.png`
      );
    } catch (error) {
      console.error('Error downloading image', error);
      snackbar.error('course.navItem.certificates.unexpected_error');
    }

    isPngLoading = false;
  };

  const loadEvaluation = async () => {
    if (!courseId) return;
    isLoading = true;
    const res = await courseApi.getCertificationEvaluation(courseId);
    if (res?.data) {
      evaluation = res.data;
      const hasEarned = res.data.certificateEarnedAt != null;
      isCourseComplete = hasEarned || !!res.data.eligibleForCertificate;

      if (res.data.isNewCompletion && courseId) {
        updateCourseCompletionModal(courseId, 'eligible', res.data);
      }
    }
    isLoading = false;
  };

  onMount(() => {
    loadEvaluation();
  });

  let title = $derived(
    isCourseComplete
      ? 'course.navItem.certificates.unlocked_certificate'
      : 'course.navItem.certificates.complete_to_download_title'
  );

  let progressLines = $derived.by(() => {
    if (!evaluation) {
      return [
        t.get('course.certificates.progress_hint', {
          current: 0,
          required: courseApi.course?.certificate?.threshold ?? 100
        })
      ];
    }
    const blockers = evaluation.blockers ?? [];
    if (blockers.length > 0) {
      return blockers.map((b) => formatBlockerMessage(b));
    }
    return [
      t.get('course.certificates.progress_hint', {
        current: evaluation.progressPercent,
        required: evaluation.certificationThreshold
      })
    ];
  });
</script>

<div class="flex-1">
  <Empty title={$t(title)} icon={DownloadIcon} variant="page">
    <div class="ui:text-muted-foreground mx-auto mb-4 max-w-md space-y-2 text-center text-sm">
      {#if isCourseComplete}
        <p>{$t('course.navItem.certificates.unlocked_certificate_subtitle')}</p>
      {:else}
        {#each progressLines as line (line)}
          <p>{line}</p>
        {/each}
      {/if}
    </div>
    <div class="flex flex-wrap items-center justify-center gap-2">
      <Button onclick={downLoadCertificate} disabled={!isCourseComplete} loading={isLoading}>
        <DownloadIcon size={16} />
        {$t('course.navItem.certificates.download_certificate')}
      </Button>
      <Button variant="outline" onclick={downloadCertificateImage} disabled={!isCourseComplete} loading={isPngLoading}>
        <ImageIcon size={16} />
        {$t('course.navItem.certificates.download_image')}
      </Button>
    </div>
  </Empty>
</div>
