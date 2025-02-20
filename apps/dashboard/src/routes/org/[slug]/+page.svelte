<script lang="ts">
  import { goto } from '$app/navigation';

  import { snackbar } from '$lib/components/Snackbar/store';
  import { getAccessToken } from '$lib/utils/functions/supabase';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import type { OrganisationAnalytics } from '$lib/utils/types/analytics';
  import Book from 'carbon-icons-svelte/lib/Book.svelte';
  import CurrencyDollar from 'carbon-icons-svelte/lib/CurrencyDollar.svelte';
  import UserMultiple from 'carbon-icons-svelte/lib/UserMultiple.svelte';

  import DropZone from '$lib/components/DropZone/index.svelte';
  import WelcomeModal from '$lib/components/WelcomeModal/WelcomeModal.svelte';
  import { t } from '$lib/utils/functions/translations';
  // export let data;

  let dashAnalytics: OrganisationAnalytics;

  function createCourse() {
    goto(`${$currentOrgPath}/courses?create=true`);
  }

  async function fetchDashAnalytics(orgId: string) {
    if (!orgId) return;

    const accessToken = await getAccessToken();

    try {
      const response = await fetch('/api/analytics/dash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken
        },
        body: JSON.stringify({ orgId })
      });

      if (!response.ok) {
        console.error(response);
        throw new Error('Failed to fetch analytics data');
      }

      dashAnalytics = (await response.json()) as OrganisationAnalytics;
    } catch (error) {
      snackbar.error('Failed to fetch analytics data');
    }
  }

  $: fetchDashAnalytics($currentOrg.id);

  $: cards = [
    {
      icon: CurrencyDollar,
      title: `${$t('dashboard.revenue')} ($)`,
      percentage: dashAnalytics?.revenue ?? 0,
      description: $t('dashboard.revenue_description'),
      hidePercentage: true
    },
    {
      icon: Book,
      title: $t('dashboard.no_of_courses'),
      percentage: dashAnalytics?.numberOfCourses ?? 0,
      description: $t('dashboard.no_courses_description'),
      hidePercentage: true
    },
    {
      icon: UserMultiple,
      title: $t('dashboard.total_students'),
      percentage: dashAnalytics?.totalStudents ?? 0,
      description: $t('dashboard.total_students_description'),
      hidePercentage: true
    }
  ];

  let uploadedImage = null;
  let isLoading = false;

  function handleImageChange(event) {
    uploadedImage = event.detail.image; // 🔹 Get the uploaded image
  }

  function handleClear() {
    uploadedImage = null; // 🔹 Clear image when 'X' is clicked
  }
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<WelcomeModal />
<DropZone
  bind:image={uploadedImage}
  bind:loading={isLoading}
  on:change={handleImageChange}
  on:clear={handleClear}
/>

{#if uploadedImage}
  <p>Uploaded Image URL: {uploadedImage}</p>
{/if}
<!-- <div class="w-full max-w-5xl px-5 py-10 md:mx-auto">
  <div class="mb-5 flex items-center justify-between">
    <h1 class="mb-3 text-2xl font-bold dark:text-white md:text-3xl">
      {$t(getGreeting())}
      {$profile.fullname}!
    </h1>
    <div class="flex items-center">
      <PrimaryButton
        variant={VARIANTS.OUTLINED}
        onClick={createCourse}
        isDisabled={!$isOrgAdmin}
        className="min-h-[36px]"
      >
        {#if $isMobile}
          <Add size={24} />
        {:else}
          {$t('dashboard.create_course')}
        {/if}
      </PrimaryButton>

      <VisitOrgSiteButton />
    </div>
  </div>

  <div class="mb-10 flex flex-wrap items-start">
    <Grid class="px-0" fullWidth>
      <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each cards as card}
          {#if !dashAnalytics}
            <SkeletonPlaceholder
              style="width: 100%; min-width: 300px; height: 10rem;"
              class="rounded-md"
            />
          {:else}
            <ActivityCard activity={card} />
          {/if}
        {/each}
      </div>
    </Grid>
  </div>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div
      class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 dark:border-neutral-600 md:p-5"
    >
      <h3 class="mt-0 text-2xl font-bold">
        {$t('dashboard.top_courses')}
      </h3>

      <div class="h-full space-y-6">
        {#if !dashAnalytics}
          {#each Array(5) as _}
            <SkeletonPlaceholder style="width: 100%; height: 40px;" class="rounded-md" />
          {/each}
        {:else}
          {#each dashAnalytics.topCourses as course}
            <div class="flex items-center gap-2">
              <div class="w-4/6 space-y-1">
                <Link href={`/courses/${course.id}`}>
                  <p class="line-clamp-2 pb-[0.1rem] text-sm font-medium leading-none">
                    {course.title}
                  </p>
                </Link>
                <p class="text-muted-foreground text-sm">
                  {course.enrollments}
                  {$t(course.enrollments === 1 ? 'dashboard.student' : 'dashboard.students')}
                </p>
              </div>
              <div class="ml-auto w-2/6">
                <Progress value={course.completion} />
                <div class="text-sm font-medium">
                  {course.completion}%
                  {$t('dashboard.completion')}
                </div>
              </div>
            </div>
          {:else}
            <div class="flex flex-col h-full items-center justify-center p-3">
              <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
                <CourseIcon width="30" height="30" />
              </div>
              <div class="my-4 text-center">
                <p class=" text-xl font-semibold">
                  {$t('dashboard.create_first_course')}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-300">
                  {$t('dashboard.create_first_course_description')}
                </p>
              </div>
              <PrimaryButton
                variant={VARIANTS.OUTLINED}
                onClick={createCourse}
                label={$t('dashboard.create_course')}
              />
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div
      class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 dark:border-neutral-600 md:p-5"
    >
      <h3 class="mt-0 text-2xl font-bold">
        {$t('dashboard.recent_enrollments')}
      </h3>

      <div class="h-full space-y-6">
        {#if !dashAnalytics}
          {#each Array(5) as _}
            <SkeletonPlaceholder style="width: 100%; height: 40px;" class="rounded-md" />
          {/each}
        {:else}
          {#each dashAnalytics.enrollments as enrollment}
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Avatar
                  src={enrollment.avatarUrl}
                  name={enrollment.name}
                  width="w-6"
                  height="h-6"
                />

                <div class="min-h-[45px] space-y-1">
                  <p class="text-sm font-medium capitalize leading-none">{enrollment.name}</p>
                  <p class="text-muted-foreground text-sm">
                    <span class="italic">
                      {calDateDiff(enrollment.date)}
                    </span>
                  </p>
                </div>
              </div>

              <div class="w-2/4">
                <Link href={`/courses/${enrollment.courseId}`}>
                  <p class="line-clamp-2 pb-[0.1rem] text-sm font-medium leading-none">
                    {enrollment.course}
                  </p>
                </Link>
              </div>
            </div>
          {:else}
            <div class="flex flex-col h-full items-center justify-center p-3">
              <div class="bg-primary-200 w-fit rounded-full p-4 text-black">
                <UserProfile size={24} />
              </div>
              <div class="my-4 text-center">
                <p class=" text-xl font-semibold">
                  {$t('dashboard.publish_first_course')}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-300">
                  {$t('dashboard.publish_first_course_description')}
                </p>
              </div>
              <PrimaryButton
                variant={VARIANTS.OUTLINED}
                onClick={() => goto(`${$currentOrgPath}/courses`)}
                label={$t('dashboard.publish_course')}
              />
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</div> -->
