<script lang="ts">
  import { onMount } from 'svelte';
  import DownloadIcon from '@lucide/svelte/icons/download';

  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { classroomio } from '$lib/utils/services/api';
  import type { CertificationEvaluationData } from '$features/course/utils/types';
  import { openCourseCompletionModal } from '$features/course/store/course-completion-modal';

  let isLoading = $state(false);
  let isCourseComplete = $state(false);
  let evaluation = $state<CertificationEvaluationData | null>(null);

  let courseId = $derived(courseApi.course?.id ?? '');

  function formatBlockerMessage(blocker: CertificationEvaluationData['blockers'][number]): string {
    const p = blocker.params ?? {};
    switch (blocker.code) {
      case 'CERT_PROGRESS':
        return t.get('course.certification.blocker_progress', {
          current: Number(p.current ?? 0),
          required: Number(p.required ?? 0)
        });
      case 'CERT_DEADLINE_PASSED':
        return t.get('course.certification.blocker_deadline');
      case 'CERT_NO_CONTENT':
        return t.get('course.certification.blocker_no_content');
      case 'CERT_FINAL_EXERCISE_NOT_SUBMITTED':
        return t.get('course.certification.blocker_final_not_submitted', {
          exerciseTitle: String(p.exerciseTitle ?? '')
        });
      case 'CERT_FINAL_EXERCISE_PENDING_GRADE':
        return t.get('course.certification.blocker_final_pending', {
          exerciseTitle: String(p.exerciseTitle ?? '')
        });
      case 'CERT_FINAL_EXERCISE_SCORE':
        return t.get('course.certification.blocker_final_score', {
          exerciseTitle: String(p.exerciseTitle ?? ''),
          bestPercent: Number(p.bestPercent ?? 0),
          requiredPercent: Number(p.requiredPercent ?? 0)
        });
      case 'CERT_FINAL_EXERCISE_MISCONFIGURED':
        return t.get('course.certification.blocker_final_misconfigured', {
          exerciseTitle: String(p.exerciseTitle ?? '')
        });
      default:
        return blocker.code;
    }
  }

  const downLoadCertificate = async () => {
    if (!isCourseComplete || !courseId) return;

    isLoading = true;
    try {
      const response = await classroomio.course[':courseId']['download']['certificate']['$post']({
        param: { courseId },
        json: {
          theme: `${courseApi.course?.certificate?.theme ?? 'professional'}`,
          studentName: `${$profile.fullname}`,
          courseName: `${courseApi.course?.title}`,
          courseDescription: `${courseApi.course?.description}`,
          orgLogoUrl: $currentOrg.avatarUrl || `${$currentOrgDomain}/logo-512.png`,
          orgName: `${$currentOrg.name}`
        }
      });

      const blobResponse = await response.blob();

      const file = new Blob([blobResponse], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      let a = document.createElement('a');
      document.body.append(a);
      a.download = 'Certificate of Completion - ' + $currentOrg.name;
      a.href = fileURL;
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading', error);
      snackbar.error($t('course.navItem.certificates.unexpected_error'));
    }

    isLoading = false;
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
        openCourseCompletionModal(courseId);
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
    <Button onclick={downLoadCertificate} disabled={!isCourseComplete} loading={isLoading}>
      <DownloadIcon size={16} />
      {$t('course.navItem.certificates.download_certificate')}
    </Button>
  </Empty>
</div>
