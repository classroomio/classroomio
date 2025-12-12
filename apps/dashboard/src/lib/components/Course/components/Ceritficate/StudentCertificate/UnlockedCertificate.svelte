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
  import { snackbar } from '$lib/components/Snackbar/store';
  import { classroomio } from '$lib/utils/services/api';

  let isLoading = $state(false);
  let isCourseComplete = $state(false);
  let progress: ProfileCourseProgress | undefined;

  const downLoadCertificate = async () => {
    if (!isCourseComplete) return;

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

<Box>
  <div class="flex h-full w-max flex-col items-center justify-center gap-5">
    <img src="/images/student-certificate-preview.png" alt="Certificate" class="max-w-[218px]" />
    <p class="text-center text-xl font-normal">
      {$t(title)}
    </p>
    <p class="max-w-md text-center text-sm font-normal">
      {$t(subtitle)}
    </p>
    <Button onclick={downLoadCertificate} disabled={!isCourseComplete} loading={isLoading}>
      <DownloadIcon size={16} />
      {$t('course.navItem.certificates.download_certificate')}
    </Button>
  </div>
</Box>
