<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import AwardIcon from '@lucide/svelte/icons/award';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check-big';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

  import * as Card from '@cio/ui/base/card';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Empty from '@cio/ui/base/empty';
  import * as Page from '@cio/ui/base/page';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { Progress } from '@cio/ui/base/progress';
  import { Separator } from '@cio/ui/base/separator';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';

  import {
    countCompletedExercises,
    courseStudent,
    courseStudentNoExercises,
    courseStudentNotStarted,
    isGraded,
    SUBMISSION_STATUS
  } from './fixtures';

  const { Story } = defineMeta({
    title: 'Templates/Course Student Detail',
    parameters: {
      layout: 'padded'
    },
    tags: ['autodocs']
  });

  const PEOPLE_HREF = '#people';

  function gradeVariant(grade: number) {
    if (grade >= 70) return 'success';
    if (grade >= 50) return 'warning';

    return 'secondary';
  }

  function scoreLabel(exercise: { score: number; totalPoints: number; status: number | undefined }) {
    // An ungraded submission has no meaningful score yet — showing "0/20" reads
    // as a zero the student earned, which is a different thing entirely.
    if (exercise.status !== SUBMISSION_STATUS.GRADED) return `—/${exercise.totalPoints}`;

    return `${exercise.score}/${exercise.totalPoints}`;
  }
</script>

<!-- ------------------------------------------------------------------ -->
<!-- Shared snippets                                                    -->
<!-- ------------------------------------------------------------------ -->

<!-- Actions collapse into one 3-dot menu. Reset is destructive and course
     scoped, so it lives here rather than as a standing header button. -->
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
      <DropdownMenu.Separator />
      <DropdownMenu.Item variant="destructive">
        <RotateCcwIcon />
        Reset progress
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

{#snippet exerciseStatusBadge(exercise)}
  {#if isGraded(exercise)}
    <Badge variant="success">
      <CircleCheckIcon />
      Graded
    </Badge>
  {:else if exercise.isCompleted}
    <Badge variant="secondary">Awaiting grade</Badge>
  {:else}
    <Badge variant="outline">Not submitted</Badge>
  {/if}
{/snippet}

<!-- ------------------------------------------------------------------ -->
<!-- Course student detail — rail + exercise list, no tabs               -->
<!-- ------------------------------------------------------------------ -->

{#snippet courseStudentDetail(data)}
  {@const completedExercises = countCompletedExercises(data.userExercisesStats)}
  {@const totalExercises = data.userExercisesStats.length}
  {@const exerciseCompletion = totalExercises === 0 ? 0 : Math.round((completedExercises / totalExercises) * 100)}
  <Page.Root>
    <Page.Header>
      <Page.HeaderContent>
        <Button variant="link" href={PEOPLE_HREF} class="ui:h-fit! ui:justify-start! ui:p-0 mb-1">
          <ArrowLeftIcon />
          <span class="text-xs">People</span>
        </Button>
      </Page.HeaderContent>
      <Page.Action>
        {@render studentActions()}
      </Page.Action>
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
          <!-- Identity rail — same construction as the audience student profile,
               with course-scoped facts instead of cross-course ones. -->
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
              <PercentRingProgress value={data.progressPercentage} size="default" />
              <p class="ui:text-muted-foreground text-xs">Course progress</p>
            </Card.Content>

            <Separator />

            <Card.Content>
              {@render factRow('Lessons', `${data.lessonsCompleted}/${data.lessonsCount}`)}
              {@render factRow('Exercises', `${completedExercises}/${totalExercises}`)}
              {@render factRow('Assignment completion', `${exerciseCompletion}%`)}
              {@render factRow('Average grade', `${data.averageGrade}%`)}
            </Card.Content>
          </Card.Root>

          <!-- Exercises. No tab bar: this is the only dataset the course-scoped
               page has, so a single-tab tab bar would be chrome for nothing. -->
          <Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
            <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-semibold">Exercises</h2>
                <Badge variant="outline" class="ui:tabular-nums">{totalExercises}</Badge>
              </div>
              {#if totalExercises > 0}
                <div class="flex w-full items-center gap-2 sm:w-48">
                  <Progress value={exerciseCompletion} class="ui:h-1.5" />
                  <span class="ui:tabular-nums ui:text-muted-foreground w-12 shrink-0 text-right text-xs">
                    {completedExercises}/{totalExercises}
                  </span>
                </div>
              {/if}
            </div>
            <Separator />

            {#if totalExercises === 0}
              <Empty.Root class="ui:py-10">
                <Empty.Header>
                  <Empty.Media variant="icon">
                    <ListChecksIcon />
                  </Empty.Media>
                  <Empty.Title>No exercises in this course</Empty.Title>
                  <Empty.Description>
                    Add an exercise to a lesson and each student's attempts show up here.
                  </Empty.Description>
                </Empty.Header>
              </Empty.Root>
            {:else}
              <ResourceListRow.Group class="ui:rounded-none ui:border-0">
                {#each data.userExercisesStats as exercise (exercise.id)}
                  <ResourceListRow.Root variant="default" align="start" class="ui:py-3">
                    <ResourceListRow.Lead class="ui:self-start">
                      <div
                        class="ui:bg-muted ui:text-muted-foreground flex size-9 items-center justify-center rounded-sm"
                      >
                        <FileTextIcon class="size-4" />
                      </div>
                    </ResourceListRow.Lead>
                    <ResourceListRow.Main class="ui:gap-1">
                      <a href="#exercise" class="line-clamp-1 text-sm font-semibold hover:underline">
                        {exercise.title}
                      </a>
                      {#if exercise.lessonId}
                        <a href="#lesson" class="ui:text-muted-foreground line-clamp-1 text-xs hover:underline">
                          {exercise.lessonTitle}
                        </a>
                      {:else}
                        <span class="ui:text-muted-foreground text-xs">Course-level exercise</span>
                      {/if}
                    </ResourceListRow.Main>
                    <ResourceListRow.End class="ui:gap-6 ui:self-start">
                      <div class="flex w-20 justify-end">
                        {#if isGraded(exercise)}
                          <Badge
                            variant={gradeVariant(Math.round((exercise.score / exercise.totalPoints) * 100))}
                            class="ui:tabular-nums"
                          >
                            {scoreLabel(exercise)}
                          </Badge>
                        {:else}
                          <span class="ui:tabular-nums ui:text-muted-foreground text-sm">{scoreLabel(exercise)}</span>
                        {/if}
                      </div>
                      <div class="flex w-32 justify-end">
                        {@render exerciseStatusBadge(exercise)}
                      </div>
                    </ResourceListRow.End>
                  </ResourceListRow.Root>
                {/each}
              </ResourceListRow.Group>
            {/if}
          </Card.Root>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
{/snippet}

<Story name="Course Student Detail">
  {#snippet template()}
    {@render courseStudentDetail(courseStudent)}
  {/snippet}
</Story>

<Story name="Course Student Detail Not Started">
  {#snippet template()}
    {@render courseStudentDetail(courseStudentNotStarted)}
  {/snippet}
</Story>

<Story name="Course Student Detail No Exercises">
  {#snippet template()}
    {@render courseStudentDetail(courseStudentNoExercises)}
  {/snippet}
</Story>
