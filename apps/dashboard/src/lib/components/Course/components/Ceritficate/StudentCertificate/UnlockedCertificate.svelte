<script lang="ts">
  import { onMount } from 'svelte';
  import DownloadIcon from '@lucide/svelte/icons/download';

  import { course } from '$lib/components/Course/store';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Button } from '@cio/ui/base/button';
  import Empty from '@cio/ui/custom/empty/empty.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { fetchProfileCourseProgress } from '$lib/utils/services/courses';
  import type { ProfileCourseProgress } from '$lib/utils/types';
  import { snackbar } from '$features/ui/snackbar/store';
  import { classroomio } from '$lib/utils/services/api';

  let isLoading = $state(false);
  let isCourseComplete = $state(false);
  let progress: ProfileCourseProgress | undefined;

  const downLoadCertificate = async () => {
    if (!isCourseComplete || !$course.id) return;

    isLoading = true;
    try {
      const response = await classroomio.course[':courseId']['download']['certificate']['$post']({
        param: { courseId: $course.id },
        json: {
          theme: `${$course.certificate_theme}`,
          studentName: `${$profile.fullname}`,
          courseName: `${$course.title}`,
          courseDescription: `${$course.description}`,
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

    const { data } = await fetchProfileCourseProgress($course.id, $profile.id);
    progress = data?.[0] || undefined;

    if (progress) {
      isCourseComplete =
        progress.lessons_count === progress.lessons_completed &&
        progress.exercises_count === progress.exercises_completed;
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
