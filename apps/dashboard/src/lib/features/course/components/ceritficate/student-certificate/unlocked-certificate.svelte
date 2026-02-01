<script lang="ts">
  import { onMount } from 'svelte';
  import DownloadIcon from '@lucide/svelte/icons/download';

  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Button } from '@cio/ui/base/button';
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courseApi } from '$features/course/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { classroomio } from '$lib/utils/services/api';

  let isLoading = $state(false);
  let isCourseComplete = $state(false);

  let courseId = $derived(courseApi.course?.id ?? '');

  const downLoadCertificate = async () => {
    if (!isCourseComplete || !courseId) return;

    isLoading = true;
    try {
      const response = await classroomio.course[':courseId']['download']['certificate']['$post']({
        param: { courseId },
        json: {
          theme: `${courseApi.course?.certificateTheme}`,
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

  const hasUserCompletedCourse = async () => {
    isLoading = true;

    const response = await courseApi.getProgress(courseId, $profile.id);

    if (courseApi.success && response?.data) {
      const progress = response.data;
      isCourseComplete =
        progress.lessonsCount === progress.lessonsCompleted && progress.exercisesCount === progress.exercisesCompleted;
    }

    isLoading = false;
  };

  onMount(() => {
    hasUserCompletedCourse();
  });

  let title = $derived(
    isCourseComplete
      ? 'course.navItem.certificates.unlocked_certificate'
      : 'course.navItem.certificates.complete_to_download_title'
  );
  let subtitle = $derived(
    isCourseComplete
      ? 'course.navItem.certificates.unlocked_certificate_subtitle'
      : 'course.navItem.certificates.complete_to_download_subtitle'
  );
</script>

<div class="flex-1">
  <Empty title={$t(title)} description={$t(subtitle)} icon={DownloadIcon} variant="page">
    <Button onclick={downLoadCertificate} disabled={!isCourseComplete} loading={isLoading}>
      <DownloadIcon size={16} />
      {$t('course.navItem.certificates.download_certificate')}
    </Button>
  </Empty>
</div>
