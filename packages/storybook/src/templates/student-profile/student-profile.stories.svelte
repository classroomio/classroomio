<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import AwardIcon from '@lucide/svelte/icons/award';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check-big';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';

  import * as Card from '@cio/ui/base/card';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Empty from '@cio/ui/base/empty';
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { Separator } from '@cio/ui/base/separator';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';

  import { analytics, countComplete, isComplete, justEnrolledAnalytics, noCoursesAnalytics } from './fixtures';

  const { Story } = defineMeta({
    title: 'Templates/Student Profile',
    parameters: {
      layout: 'padded'
    },
    tags: ['autodocs']
  });

  const AUDIENCE_HREF = '#audience';

  function gradeVariant(grade: number) {
    if (grade >= 70) return 'success';
    if (grade >= 50) return 'warning';

    return 'secondary';
  }
</script>

<!-- ------------------------------------------------------------------ -->
<!-- Shared snippets                                                    -->
<!-- ------------------------------------------------------------------ -->

<!-- One 3-dot menu rather than standing buttons. No "Reset progress" here:
     reset is course-scoped (POST /course/:courseId/members/:memberId/…), so it
     belongs on the course-scoped page, not this cross-course one. -->
{#snippet studentActions()}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="secondary" size="icon" aria-label="Student actions">
          <EllipsisIcon />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item>
        <DownloadIcon />
        Export progress
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/snippet}

{#snippet factRow(label, value)}
  <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
    <span class="ui:text-muted-foreground">{label}</span>
    <span class="ui:tabular-nums font-medium">{value}</span>
  </div>
{/snippet}

{#snippet courseStatusBadge(course)}
  {#if isComplete(course)}
    <Badge variant="success">
      <CircleCheckIcon />
      Complete
    </Badge>
  {:else if course.lessons_completed === 0}
    <Badge variant="outline">Not started</Badge>
  {:else}
    <Badge variant="secondary">In progress</Badge>
  {/if}
{/snippet}

<!-- ------------------------------------------------------------------ -->
<!-- Student profile — identity rail + tabbed detail                     -->
<!-- ------------------------------------------------------------------ -->

{#snippet studentProfile(data, openTab = 'courses')}
  {@const completed = countComplete(data.courses)}
  {@const inProgress = data.courses.filter((course) => !isComplete(course) && course.lessons_completed > 0).length}
  <Page.Root>
    <Page.Header>
      <Page.HeaderContent>
        <Button variant="link" href={AUDIENCE_HREF} class="ui:h-fit! ui:justify-start! ui:p-0 mb-1">
          <ArrowLeftIcon />
          <span class="text-xs">Audience</span>
        </Button>
      </Page.HeaderContent>
      <Page.Action>
        {@render studentActions()}
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
          <!-- Identity rail -->
          <Card.Root class="ui:gap-4 ui:py-4 lg:sticky lg:top-4">
            <Card.Content class="flex flex-col items-center gap-3 text-center">
              <UserAvatar src={data.user.avatarUrl} alt={data.user.fullName} class="ui:size-20" />
              <div class="flex flex-col gap-1">
                <p class="text-base font-semibold">{data.user.fullName}</p>
                <p class="ui:text-muted-foreground text-sm break-all">{data.user.email}</p>
              </div>
              <Badge variant="secondary">
                <ClockIcon />
                Last seen {data.user.lastSeen ?? 'a while ago'}
              </Badge>
            </Card.Content>

            <Separator />

            <Card.Content class="flex flex-col items-center gap-1">
              <PercentRingProgress value={data.overallCourseProgress} size="default" />
              <p class="ui:text-muted-foreground text-xs">Overall course progress</p>
            </Card.Content>

            <Separator />

            <Card.Content>
              {@render factRow('Enrolled courses', data.courses.length)}
              {@render factRow('Completed', completed)}
              {@render factRow('In progress', inProgress)}
              {@render factRow('Average grade', `${data.overallAverageGrade}%`)}
            </Card.Content>
          </Card.Root>

          <!-- Detail column -->
          <UnderlineTabs.Root value={openTab}>
            <UnderlineTabs.List>
              <UnderlineTabs.Trigger value="courses">
                <BookOpenIcon />
                Courses
                <Badge variant="secondary" class="ui:tabular-nums">{data.courses.length}</Badge>
              </UnderlineTabs.Trigger>
              <UnderlineTabs.Trigger value="grades">
                <AwardIcon />
                Grades
              </UnderlineTabs.Trigger>
              <UnderlineTabs.Trigger value="activity">
                <ClockIcon />
                Activity
              </UnderlineTabs.Trigger>
            </UnderlineTabs.List>

            <UnderlineTabs.Content value="courses" class="pt-3">
              {#if data.courses.length === 0}
                <Empty.Root class="ui:py-10">
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <BookOpenIcon />
                    </Empty.Media>
                    <Empty.Title>No courses yet</Empty.Title>
                    <Empty.Description>Enroll this student to start tracking progress.</Empty.Description>
                  </Empty.Header>
                </Empty.Root>
              {:else}
                <div class="grid grid-cols-1 gap-3 2xl:grid-cols-2">
                  {#each data.courses as course (course.id)}
                    <Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
                      <div class="flex items-start gap-3 p-4">
                        <div class="h-12 w-16 shrink-0 overflow-hidden rounded-sm">
                          <img src={course.logo} alt="" class="h-full w-full object-cover" />
                        </div>
                        <div class="flex min-w-0 flex-1 flex-col gap-1">
                          <div class="flex items-start justify-between gap-2">
                            <a href="#course" class="line-clamp-1 text-sm font-semibold hover:underline">
                              {course.title}
                            </a>
                            {@render courseStatusBadge(course)}
                          </div>
                          <p class="ui:text-muted-foreground line-clamp-2 text-xs">{course.description}</p>
                        </div>
                      </div>
                      <Separator />
                      <div class="flex items-center gap-4 px-4 py-3">
                        <PercentRingProgress value={course.progress_percentage} />
                        <div class="grid flex-1 grid-cols-3 gap-2 text-xs">
                          <div class="flex flex-col">
                            <span class="ui:text-muted-foreground">Lessons</span>
                            <span class="ui:tabular-nums font-medium">
                              {course.lessons_completed}/{course.lessons_count}
                            </span>
                          </div>
                          <div class="flex flex-col">
                            <span class="ui:text-muted-foreground">Exercises</span>
                            <span class="ui:tabular-nums font-medium">
                              {course.exercises_completed}/{course.exercises_count}
                            </span>
                          </div>
                          <div class="flex flex-col">
                            <span class="ui:text-muted-foreground">Grade</span>
                            <span class="ui:tabular-nums font-medium">{course.average_grade}%</span>
                          </div>
                        </div>
                      </div>
                    </Card.Root>
                  {/each}
                </div>
              {/if}
            </UnderlineTabs.Content>

            <!-- Grades: per-exercise rows grouped under a course header row. The
                 rows come from `getUserExercisesStats`, which the service already
                 fetches per course and currently discards after averaging. -->
            <UnderlineTabs.Content value="grades" class="pt-3">
              {#if data.courses.length === 0}
                <Empty.Root class="ui:py-10">
                  <Empty.Header>
                    <Empty.Media variant="icon">
                      <AwardIcon />
                    </Empty.Media>
                    <Empty.Title>Nothing graded yet</Empty.Title>
                    <Empty.Description>Grades appear once this student submits an exercise.</Empty.Description>
                  </Empty.Header>
                </Empty.Root>
              {:else}
                <Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
                  <Table.Root>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>Exercise</Table.Head>
                        <Table.Head class="ui:w-28 ui:text-right">Score</Table.Head>
                        <Table.Head class="ui:w-28">Status</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {#each data.courses as course (course.id)}
                        <!-- Group header: the course, then its exercises beneath. -->
                        <Table.Row class="ui:bg-muted/50">
                          <Table.Cell class="font-semibold">{course.title}</Table.Cell>
                          <Table.Cell class="ui:tabular-nums ui:text-right">
                            {course.exercises_completed}/{course.exercises_count}
                          </Table.Cell>
                          <Table.Cell>
                            <Badge variant={gradeVariant(course.average_grade)} class="ui:tabular-nums">
                              {course.average_grade}% avg
                            </Badge>
                          </Table.Cell>
                        </Table.Row>
                        {#each course.exercises ?? [] as exercise (exercise.id)}
                          <Table.Row>
                            <Table.Cell class="ui:pl-6">
                              <a href="#exercise" class="text-sm hover:underline">{exercise.title}</a>
                              <span class="ui:text-muted-foreground block text-xs">{exercise.lessonTitle}</span>
                            </Table.Cell>
                            <Table.Cell class="ui:tabular-nums ui:text-right">
                              {exercise.status === 3
                                ? `${exercise.score}/${exercise.totalPoints}`
                                : `—/${exercise.totalPoints}`}
                            </Table.Cell>
                            <Table.Cell>
                              {#if exercise.status === 3}
                                <Badge variant="success">Graded</Badge>
                              {:else if exercise.isCompleted}
                                <Badge variant="secondary">Awaiting grade</Badge>
                              {:else}
                                <Badge variant="outline">Not submitted</Badge>
                              {/if}
                            </Table.Cell>
                          </Table.Row>
                        {/each}
                      {/each}
                    </Table.Body>
                  </Table.Root>
                </Card.Root>
              {/if}
            </UnderlineTabs.Content>

            <UnderlineTabs.Content value="activity" class="pt-3">
              <Empty.Root class="ui:py-10">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <ClockIcon />
                  </Empty.Media>
                  <Empty.Title>Activity timeline</Empty.Title>
                  <Empty.Description>
                    Lesson completions and submissions over time. Not in this release — timestamps exist
                    (lesson_completion.created_at, submission.created_at) but no endpoint returns them yet.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Root>
            </UnderlineTabs.Content>
          </UnderlineTabs.Root>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
{/snippet}

<Story name="Student Profile">
  {#snippet template()}
    {@render studentProfile(analytics)}
  {/snippet}
</Story>

<Story name="Student Profile Grades Tab">
  {#snippet template()}
    {@render studentProfile(analytics, 'grades')}
  {/snippet}
</Story>

<Story name="Student Profile Activity Tab">
  {#snippet template()}
    {@render studentProfile(analytics, 'activity')}
  {/snippet}
</Story>

<Story name="Student Profile Single Course">
  {#snippet template()}
    {@render studentProfile(justEnrolledAnalytics)}
  {/snippet}
</Story>

<Story name="Student Profile No Courses">
  {#snippet template()}
    {@render studentProfile(noCoursesAnalytics)}
  {/snippet}
</Story>
