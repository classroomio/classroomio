<script lang="ts">
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUp from 'carbon-icons-svelte/lib/ChevronUp.svelte';
  import Download from 'carbon-icons-svelte/lib/Download.svelte';

  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  import Box from '$lib/components/Box/index.svelte';
  import { course } from '$lib/components/Course/store';
  import { pathway } from '$lib/components/Pathway/store';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { fetchMultipleCoursesProgress } from '$lib/utils/services/courses';
  import type { PathwayCourse, ProfileCourseProgress } from '$lib/utils/types';
  import { onMount } from 'svelte';

  export let isPathwayComplete = false;

  let isLoading = false;
  let showCourses = true;
  let completedCourses: PathwayCourse[];

  function toggleCourse() {
    showCourses = !showCourses;
  }

  const downLoadPathwayCertificate = async () => {
    if (!isPathwayComplete) return;
    isLoading = true;
    try {
      const response = await fetch(PUBLIC_SERVER_URL + '/downloadCertificate', {
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

  const downLoadCertificate = async () => {
    if (!isPathwayComplete) return;
    isLoading = true;
    try {
      const response = await fetch(PUBLIC_SERVER_URL + '/downloadCertificate', {
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

  const getCompletedCourseIds = (
    completedCourses: ProfileCourseProgress[],
    courseIds: string[]
  ) => {
    return completedCourses
      .map((course, index) => {
        const isCompleted =
          course.lessons_completed === course.lessons_count &&
          course.exercises_completed === course.exercises_count;
        return isCompleted ? courseIds[index] : null;
      })
      .filter((id) => id !== null);
  };

  const getCompletedCourseObjects = (completedCourseIds: string[], pathwayCourses: any[]) => {
    return pathwayCourses.filter((course) => completedCourseIds.includes(course.course_id));
  };

  const hasUserCompletedCourse = async () => {
    isLoading = true;

    const courseIds = $pathway.pathway_course.map((course) => course.course_id);
    const { data } = await fetchMultipleCoursesProgress(courseIds, $profile.id);

    if (data) {
      const completedCourseIds = getCompletedCourseIds(data, courseIds);
      completedCourses = getCompletedCourseObjects(completedCourseIds, $pathway.pathway_course);
    }

    isLoading = false;
  };

  onMount(() => {
    hasUserCompletedCourse();
  });

  $: title = isPathwayComplete
    ? 'pathway.pages.lms_certificate.unlocked.title'
    : 'pathway.pages.lms_certificate.locked.title';
  $: subtitle = isPathwayComplete
    ? 'pathway.pages.lms_certificate.unlocked.subtitle'
    : 'pathway.pages.lms_certificate.unlocked.subtitle';
</script>

<Box className="h-auto">
  <div class="flex flex-col flex-wrap items-center justify-between gap-y-5 p-5 md:flex-row md:p-10">
    <img
      src="/images/student-certificate-preview.png"
      alt="Certificate"
      class="bg-[#F1F6FF] p-3 md:w-[30%]"
    />
    <div class="text-center md:w-[55%] md:text-left">
      <p class="text-xl font-medium">
        {$t(title)}
      </p>
      <p class="my-2 max-w-md text-sm font-normal">
        {$t(subtitle)}
      </p>
      <div class="mt-5 flex flex-wrap items-center justify-center gap-y-3 md:justify-between">
        <PrimaryButton
          className="flex items-center gap-2 text-xs"
          onClick={downLoadCertificate}
          variant={VARIANTS.CONTAINED}
          isDisabled={!PUBLIC_SERVER_URL || !isPathwayComplete}
          {isLoading}
        >
          <Download size={16} />
          {$t('course.navItem.certificates.download_certificate')}
        </PrimaryButton>
        <PrimaryButton
          className="px-10 text-sm border-blue-700 hover:border-black text-blue-700 font-medium"
          onClick={downLoadCertificate}
          variant={VARIANTS.OUTLINED}
          isDisabled={!PUBLIC_SERVER_URL || !isPathwayComplete}
          {isLoading}
        >
          {$t('pathway.pages.lms_certificate.share')}
        </PrimaryButton>
      </div>
    </div>
  </div>
  <div class="flex w-full flex-col justify-between gap-y-5 border-t px-14 py-10 md:flex-row">
    <div>
      <h1 class="m-0 text-base">{$t('pathway.pages.lms_certificate.courses_completed')}</h1>
      <p class="mt-1 text-sm">{$t('pathway.pages.lms_certificate.achieve')}</p>
    </div>

    <div class="flex items-center gap-1">
      <PrimaryButton
        className="flex items-center gap-2 text-xs underline font-bold text-blue-700"
        onClick={downLoadCertificate}
        variant={VARIANTS.TEXT}
        isDisabled={completedCourses?.length <= 0}
        {isLoading}
      >
        <Download size={16} />
        {$t('course.navItem.certificates.download_certificate')}
      </PrimaryButton>
      <button
        type="button"
        on:click={toggleCourse}
        disabled={completedCourses?.length <= 0}
        class="rounded-full p-1 hover:bg-gray-200 {completedCourses?.length <= 0 &&
          'cursor-not-allowed'}"
      >
        {#if showCourses}
          <ChevronUp />
        {:else}
          <ChevronDown />
        {/if}
      </button>
    </div>
  </div>

  {#if completedCourses?.length > 0 && showCourses}
    <div class="border-t px-14">
      {#each completedCourses as course}
        <div class="flex items-center justify-between border-b py-4 text-left">
          <div class="w-[30%] text-sm font-medium">
            {course.course.title}
          </div>

          <div class="w-[40%] text-xs">
            {course.course.description}
          </div>

          <button type="button" class="text-xs font-medium text-[#0233BD] underline"
            >Download this certificate</button
          >
        </div>
      {/each}
    </div>
  {/if}
</Box>
