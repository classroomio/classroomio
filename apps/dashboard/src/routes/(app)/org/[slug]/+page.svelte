<script lang="ts">
  import { goto } from '$app/navigation';
  import AwardIcon from '@lucide/svelte/icons/award';
  import BookIcon from '@lucide/svelte/icons/book';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import UsersIcon from '@lucide/svelte/icons/users';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { getGreeting } from '$lib/utils/functions/date';
  import { currentOrgPath } from '$lib/utils/store/org';

  import { CreateCourseButton } from '$features/course/components';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { Progress } from '@cio/ui/base/progress';
  import { Button } from '@cio/ui/base/button';
  import { WelcomeModal } from '$features/onboarding/components';
  import { ActivityCard, VisitOrgSiteButton } from '$features/ui';
  import LoginActivityChart from '$features/org/components/login-activity-chart.svelte';
  import * as Page from '@cio/ui/base/page';
  import { Empty } from '@cio/ui/custom/empty';

  const { data } = $props();

  const stats = $derived(data.stats);
  const loginActivity = $derived(data.loginActivity);
  const recentCertifications = $derived(stats?.recentCertifications || []);
  const numberOfCourses = $derived(stats?.numberOfCourses || 0);
  const totalCertificates = $derived(stats?.totalCertificates || 0);
  const totalStudents = $derived(stats?.totalStudents || 0);
  const topCourses = $derived(stats?.topCourses || []);
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
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <div class="mb-10 flex flex-wrap items-start">
        <div class="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActivityCard
            activity={{
              icon: AwardIcon,
              title: $t('dashboard.certificates_earned'),
              percentage: totalCertificates ?? 0,
              description: $t('dashboard.certificates_earned_description'),
              hidePercentage: true
            }}
          />
          <ActivityCard
            activity={{
              icon: BookIcon,
              title: $t('dashboard.no_of_courses'),
              percentage: numberOfCourses ?? 0,
              description: $t('dashboard.no_courses_description'),
              hidePercentage: true
            }}
          />
          <ActivityCard
            activity={{
              icon: UsersIcon,
              title: $t('dashboard.total_students'),
              percentage: totalStudents ?? 0,
              description: $t('dashboard.total_students_description'),
              hidePercentage: true
            }}
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="bg-card flex min-h-[45vh] w-full flex-col rounded-xl border p-3 md:p-5 dark:text-white">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold tracking-tight">
              {$t('dashboard.top_courses')}
            </h3>
          </div>

          <div class="flex h-full flex-col">
            {#if !stats}
              <div class="space-y-3">
                {#each Array(5) as _, i (i)}
                  <Skeleton class="h-16 w-full rounded-lg" />
                {/each}
              </div>
            {:else if topCourses.length === 0}
              <Empty
                title={$t('dashboard.create_first_course')}
                description={$t('dashboard.create_first_course_description')}
                icon={BookIcon}
                class="h-full"
              >
                <CreateCourseButton variant="outline" />
              </Empty>
            {:else}
              <ul class="ui:divide-border -mx-2 divide-y">
                {#each topCourses as course, i (course.id)}
                  {@const rank = i + 1}
                  <li>
                    <a
                      href={`/courses/${course.id}`}
                      class="group ui:hover:bg-muted/50 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors md:gap-4"
                    >
                      <span
                        class={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                          rank === 1 &&
                            'ui:bg-amber-100 ui:text-amber-900 ui:dark:bg-amber-500/20 ui:dark:text-amber-200',
                          rank === 2 &&
                            'ui:bg-slate-100 ui:text-slate-700 ui:dark:bg-slate-500/20 ui:dark:text-slate-200',
                          rank === 3 &&
                            'ui:bg-orange-100 ui:text-orange-800 ui:dark:bg-orange-500/20 ui:dark:text-orange-200',
                          rank > 3 && 'ui:bg-muted ui:text-muted-foreground'
                        ]}
                      >
                        {rank}
                      </span>

                      <div class="min-w-0 flex-1">
                        <p class="line-clamp-1 text-sm leading-snug font-medium group-hover:underline">
                          {course.title}
                        </p>
                        <div class="ui:text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                          <UsersIcon class="h-3 w-3" />
                          <span class="tabular-nums">{course.enrollments}</span>
                          <span>
                            {$t(course.enrollments === 1 ? 'dashboard.student' : 'dashboard.students')}
                          </span>
                        </div>
                      </div>

                      <div class="hidden w-48 shrink-0 grid-cols-2 gap-3 sm:grid">
                        <div class="space-y-1">
                          <div class="flex items-baseline justify-between gap-1">
                            <span class="ui:text-muted-foreground text-[10px] tracking-wide uppercase">
                              {$t('dashboard.completion')}
                            </span>
                            <span class="text-xs font-semibold tabular-nums">{course.completion}%</span>
                          </div>
                          <Progress value={course.completion} class="ui:h-1.5" />
                        </div>
                        <div class="space-y-1">
                          <div class="flex items-baseline justify-between gap-1">
                            <span class="ui:text-muted-foreground text-[10px] tracking-wide uppercase">
                              {$t('dashboard.certification_rate')}
                            </span>
                            <span class="text-xs font-semibold tabular-nums">{course.certification}%</span>
                          </div>
                          <Progress value={course.certification} class="ui:h-1.5" />
                        </div>
                      </div>

                      <ChevronRightIcon
                        class="ui:text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <div class="flex min-h-[45vh] w-full flex-col rounded-md border p-3 md:p-5 dark:text-white">
          <h3 class="mb-4 text-lg">
            {$t('dashboard.recent_certifications')}
          </h3>

          <div class="h-full space-y-6">
            {#if !stats}
              {#each Array(5) as _, i (i)}
                <Skeleton class="h-10 w-full rounded-md" />
              {/each}
            {:else}
              {#each recentCertifications as certification (`${certification.id}-${certification.courseId}-${certification.date}`)}
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <UserAvatar src={certification.avatarUrl} alt={certification.name ?? 'User'} class="h-6 w-6" />

                    <div class="min-h-[45px] space-y-1">
                      <p class="text-sm leading-none capitalize">{certification.name}</p>
                      <p class="ui:text-muted-foreground text-sm">
                        <span class="italic">
                          {calDateDiff(certification.date)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div class="w-2/4">
                    <a class="hover:underline" href={`/courses/${certification.courseId}`}>
                      <p class="line-clamp-2 pb-[0.1rem] text-sm leading-none">
                        {certification.course}
                      </p>
                    </a>
                  </div>
                </div>
              {:else}
                <Empty
                  title={$t('dashboard.no_certifications_yet')}
                  description={$t('dashboard.no_certifications_yet_description')}
                  icon={AwardIcon}
                  class="h-full"
                >
                  <Button variant="outline" onclick={() => goto(`${$currentOrgPath}/courses`)}>
                    {$t('dashboard.view_courses')}
                  </Button>
                </Empty>
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div class="mt-4">
        <LoginActivityChart data={loginActivity} />
      </div>
    {/snippet}
  </Page.Body>
</Page.Root>
