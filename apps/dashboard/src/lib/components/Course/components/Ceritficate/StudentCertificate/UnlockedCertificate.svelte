<script lang="ts">
  import { onMount } from 'svelte';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';

  import { env } from '$env/dynamic/public';
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Box from '$lib/components/Box/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { fetchProfileCourseProgress } from '$lib/utils/services/courses';
  import type { ProfileCourseProgress } from '$lib/utils/types';
  import { snackbar } from '$lib/components/Snackbar/store';

  let isLoading = false;
  let isCourseComplete = false;
  let progress: ProfileCourseProgress | undefined;

  const downLoadCertificate = async () => {
    if (!isCourseComplete) return;

    isLoading = true;
    try {
      const response = await fetch(env.PUBLIC_SERVER_URL + '/downloadCertificate', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          theme: `${$course.certificate_theme}`,
          studentName: `${$profile.fullname}`,
          courseName: `${$course.title}`,
          courseDescription: `${$course.description}`,
          orgLogoUrl: `${$currentOrg.avatar_url}`,
          orgName: `${$currentOrg.name}`
        })
      });
      const data = await response.blob();
      console.log(data);
      const file = new Blob([data], { type: 'application/pdf' });
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

  $: title = isCourseComplete
    ? 'course.navItem.certificates.unlocked_certificate'
    : 'course.navItem.certificates.complete_to_download_title';
  $: subtitle = isCourseComplete
    ? 'course.navItem.certificates.unlocked_certificate_subtitle'
    : 'course.navItem.certificates.complete_to_download_subtitle';
</script>

<Box>
  <div class="flex flex-col items-center justify-center w-max h-full gap-5">
    <img src="/images/student-certificate-preview.png" alt="Certificate" class="max-w-[218px]" />
    <p class="text-xl font-normal text-center">
      {$t(title)}
    </p>
    <p class="text-sm font-normal text-center max-w-md">
      {$t(subtitle)}
    </p>
    <PrimaryButton
      className="flex items-center gap-2"
      onClick={downLoadCertificate}
      variant={VARIANTS.CONTAINED_DARK}
      isDisabled={!PUBLIC_SERVER_URL || !isCourseComplete}
      {isLoading}
    >
      <Download size={16} />
      {$t('course.navItem.certificates.download_certificate')}
    </PrimaryButton>
  </div>
</Box>
