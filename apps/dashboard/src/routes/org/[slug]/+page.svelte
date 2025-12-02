<script lang="ts">
  import { goto } from '$app/navigation';
  import BookIcon from '@lucide/svelte/icons/book';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import UserIcon from '@lucide/svelte/icons/user';
  import UsersIcon from '@lucide/svelte/icons/users';
  import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';

  import type { PageData } from './$types';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { getGreeting } from '$lib/utils/functions/date';
  import { currentOrgPath } from '$lib/utils/store/org';

  import { CreateCourseButton } from '$lib/features/course/components';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { ActivityCard } from '$lib/components/Analytics';
  import Progress from '$lib/components/Progress/index.svelte';
  import { Button } from '@cio/ui/base/button';
  import { WelcomeModal } from '$lib/features/onboarding/components';
  import VisitOrgSiteButton from '$lib/components/Buttons/VisitOrgSite.svelte';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';

  const props = $props();
  const data: PageData = props.data;

  const { enrollments, numberOfCourses, revenue, totalStudents, topCourses } = data;

  function createCourse() {
    goto(`${$currentOrgPath}/courses?create=true`);
  }
  
  let cards = $derived([
    {
      icon: DollarSignIcon,
      title: `${$t('dashboard.revenue')} ($)`,
      percentage: revenue ?? 0,
      description: $t('dashboard.revenue_description'),
      hidePercentage: true
    },
    {
      icon: BookIcon,
      title: $t('dashboard.no_of_courses'),
      percentage: numberOfCourses ?? 0,
      description: $t('dashboard.no_courses_description'),
      hidePercentage: true
    },
    {
      icon: UsersIcon,
      title: $t('dashboard.total_students'),
      percentage: totalStudents ?? 0,
      description: $t('dashboard.total_students_description'),
      hidePercentage: true
    }
  ]);
</script>

<svelte:head>
  <title>Dashboard - ClassroomIO</title>
</svelte:head>

<WelcomeModal />

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>
        {$t(getGreeting())}
        {$profile.fullname}!
      </Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <CreateCourseButton variant="outline" isResponsive />

      <VisitOrgSiteButton />
    </div>
  </div>

  <div class="mb-10 flex flex-wrap items-start">
    <Grid class="px-0">
      <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each cards as card}
          {#if !revenue && !numberOfCourses && !totalStudents}
            <Skeleton style="width: 100%; height: 10rem;" class="rounded-md" />
          {:else}
            <ActivityCard activity={card} />
          {/if}
        {/each}
      </div>
    </Grid>
  </div>

  <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
    <div class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 md:p-5 dark:border-neutral-600 dark:text-white">
      <h3 class="mt-0 text-2xl">
        {$t('dashboard.top_courses')}
      </h3>

      <div class="h-full space-y-6">
        {#if !topCourses}
          {#each Array(5) as _}
            <Skeleton class="h-10 w-full rounded-md" />
          {/each}
        {:else}
          {#each topCourses as course}
            <div class="flex items-center gap-2">
              <div class="w-4/6 space-y-1">
                <a href={`/courses/${course.id}`}>
                  <p class="line-clamp-2 pb-[0.1rem] text-sm font-medium leading-none">
                    {course.title}
                  </p>
                </a>
                <p class="text-sm">
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
                <LibraryBigIcon size={30} />
              </div>
              <div class="my-4 text-center">
                <p class=" text-xl font-semibold">
                  {$t('dashboard.create_first_course')}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-300">
                  {$t('dashboard.create_first_course_description')}
                </p>
              </div>
              <PrimaryButton variant={VARIANTS.OUTLINED} onClick={createCourse} label={$t('dashboard.create_course')} />
            </div>
          {/each}
        </div>
      </div>

    <div class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 md:p-5 dark:border-neutral-600 dark:text-white">
      <h3 class="mt-0 text-lg">
        {$t('dashboard.recent_enrollments')}
      </h3>

      <div class="h-full space-y-6">
        {#if !enrollments}
          {#each Array(5) as _}
            <Skeleton class="h-10 w-full rounded-md" />
          {/each}
        {:else}
          {#each enrollments as enrollment}
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Avatar src={enrollment.avatarUrl} name={enrollment.name} width="w-6" height="h-6" />

                <div class="min-h-[45px] space-y-1">
                  <p class="text-sm font-medium capitalize leading-none">{enrollment.name}</p>
                  <p class="text-muted-foreground text-sm">
                    <span class="italic">
                      {calDateDiff(enrollment.date)}
                    </span>
                  </p>
                </div>
              {:else}
                <Empty
                  title={$t('dashboard.create_first_course')}
                  description={$t('dashboard.create_first_course_description')}
                  icon={BookIcon}
                  class="h-full"
                >
                  <CreateCourseButton variant="outline" />
                </Empty>
              {/each}
            {/if}
          </div>
        </div>

        <div
          class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 md:p-5 dark:border-neutral-600 dark:text-white"
        >
          <h3 class="mt-0 text-lg">
            {$t('dashboard.recent_enrollments')}
          </h3>

          <div class="h-full space-y-6">
            {#if !dashAnalytics}
              {#each Array(5) as _}
                <Skeleton class="h-10 w-full rounded-md" />
              {/each}
            {:else}
              {#each dashAnalytics.enrollments as enrollment}
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <Avatar src={enrollment.avatarUrl} name={enrollment.name} width="w-6" height="h-6" />

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
                    <a href={`/courses/${enrollment.courseId}`}>
                      <p class="line-clamp-2 pb-[0.1rem] text-sm font-medium leading-none">
                        {enrollment.course}
                      </p>
                    </a>
                  </div>
                </div>
              {:else}
                <Empty
                  title={$t('dashboard.publish_first_course')}
                  description={$t('dashboard.publish_first_course_description')}
                  icon={UserIcon}
                  class="h-full"
                >
                  <Button variant="outline" onclick={() => goto(`${$currentOrgPath}/courses`)}>
                    {$t('dashboard.publish_course')}
                  </Button>
                </Empty>
              {/each}
            {/if}
          </div>
        </div>
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
