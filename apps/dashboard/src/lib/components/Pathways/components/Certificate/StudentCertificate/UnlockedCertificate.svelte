<script lang="ts">
  import Download from 'carbon-icons-svelte/lib/Download.svelte';
  import ChevronDown from 'carbon-icons-svelte/lib/ChevronDown.svelte';
  import ChevronUp from 'carbon-icons-svelte/lib/ChevronUp.svelte';

  import { PUBLIC_SERVER_URL } from '$env/static/public';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$lib/components/Snackbar/store';
  import Box from '$lib/components/Box/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  import { pathway } from '$lib/components/Pathways/store';
  import type { ProfilePathwayProgress } from '$lib/utils/types';
  import { fetchProfilePathwayProgress } from '$lib/utils/services/pathways';

  export let isPathwayComplete = false;

  let isLoading = false;
  let showCourses = true;
  let progress: ProfilePathwayProgress | undefined;

  function toggleCourse() {
    showCourses = !showCourses;
  }

  const downLoadCertificate = async () => {
    // if (!isPathwayComplete) return;
    // isLoading = true;
    // try {
    //   const response = await fetch(PUBLIC_SERVER_URL + '/downloadCertificate', {
    //     method: 'POST',
    //     headers: {
    //       Accept: 'application/json',
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //       theme: `${$course.certificate_theme}`,
    //       studentName: `${$profile.fullname}`,
    //       courseName: `${$course.title}`,
    //       courseDescription: `${$course.description}`,
    //       orgLogoUrl: `${$currentOrg.avatar_url}`,
    //       orgName: `${$currentOrg.name}`
    //     })
    //   });
    //   const data = await response.blob();
    //   console.log(data);
    //   const file = new Blob([data], { type: 'application/pdf' });
    //   const fileURL = URL.createObjectURL(file);
    //   let a = document.createElement('a');
    //   document.body.append(a);
    //   a.download = 'Certificate of Completion - ' + $currentOrg.name;
    //   a.href = fileURL;
    //   a.click();
    //   a.remove();
    // } catch (error) {
    //   console.error('Error downloading', error);
    //   snackbar.error($t('course.navItem.certificates.unexpected_error'));
    // }
    // isLoading = false;
  };

  // const hasUserCompletedCourse = async () => {
  // isLoading = true;
  // const { data } = await fetchPathwayCourseProgress($pathway.id, $profile.id);
  // progress = data?.[0] || undefined;
  // if (progress) {
  //   isPathwayComplete =
  //     progress.lessons_count === progress.lessons_completed &&
  //     progress.exercises_count === progress.exercises_completed;
  // }
  // isLoading = false;
  // };

  // onMount(() => {
  //   hasUserCompletedCourse();
  // });

  $: title = isPathwayComplete
    ? 'pathway.pages.lms_certificate.unlocked.title'
    : 'pathway.pages.lms_certificate.locked.title';
  $: subtitle = isPathwayComplete
    ? 'pathway.pages.lms_certificate.unlocked.subtitle'
    : 'pathway.pages.lms_certificate.unlocked.subtitle';

  $: console.log('$pathway.pathway_course', $pathway.pathway_course);
</script>

<Box className="h-auto">
  <div class="flex flex-wrap flex-col gap-y-5 md:flex-row items-center justify-between p-5 md:p-10">
    <img
      src="/images/student-certificate-preview.png"
      alt="Certificate"
      class="md:w-[30%] p-3 bg-[#F1F6FF]"
    />
    <div class="md:w-[55%] text-center md:text-left">
      <p class="text-xl font-medium">
        {$t(title)}
      </p>
      <p class="text-sm my-2 font-normal max-w-md">
        {$t(subtitle)}
      </p>
      <div class="flex flex-wrap gap-y-3 items-center mt-5 justify-center md:justify-between">
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
  <div class="py-10 px-14 w-full flex flex-col md:flex-row gap-y-5 justify-between border-t">
    <div>
      <h1 class="text-base m-0">Courses Completed</h1>
      <p class="text-sm mt-1">includes courses you have completed to achieve this learning path</p>
    </div>

    <div class="flex items-center gap-1">
      <PrimaryButton
        className="flex items-center gap-2 text-xs underline font-bold text-blue-700"
        onClick={downLoadCertificate}
        variant={VARIANTS.TEXT}
        isDisabled={!PUBLIC_SERVER_URL || !isPathwayComplete}
        {isLoading}
      >
        <Download size={16} />
        {$t('course.navItem.certificates.download_certificate')}
      </PrimaryButton>
      <button
        type="button"
        on:click={toggleCourse}
        disabled={!PUBLIC_SERVER_URL || !isPathwayComplete}
        class="p-1 rounded-full hover:bg-gray-200 {!PUBLIC_SERVER_URL ||
          (!isPathwayComplete && 'cursor-not-allowed')}"
      >
        {#if showCourses}
          <ChevronUp />
        {:else}
          <ChevronDown />
        {/if}
      </button>
    </div>
  </div>

  <!-- @Best, for this condition, 
    i'm not sure if you want the whole pathway to be complete before the student has the option to download completed courses
    OR you still want to allow the students view the listed courses and we desable the download button for uncompleted courses -->
  <!--   {#if isPathwayComplete && $pathway.courses.length > 0 && showCourses} -->

  {#if $pathway.pathway_course?.length > 0 && showCourses}
    <div class="px-14 border-t">
      {#each $pathway.pathway_course as course}
        <div class="flex justify-between items-center py-4 border-b text-left">
          <div class="w-[30%] text-sm font-medium">
            {course.course.title}
          </div>

          <div class="w-[40%] text-xs">
            {course.course.description}
          </div>

          <button type="button" class="text-[#0233BD] text-xs font-medium underline"
            >Download this certificate</button
          >
        </div>
      {/each}
    </div>
  {/if}
</Box>
