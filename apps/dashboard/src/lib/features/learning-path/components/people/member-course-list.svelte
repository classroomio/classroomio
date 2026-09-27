<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import * as Empty from '@cio/ui/base/empty';
  import { Progress } from '@cio/ui/base/progress';
  import * as Separator from '@cio/ui/base/separator';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import { t } from '$lib/utils/functions/translations';
  import type { PathMemberDetail } from '../../utils/types';
  import { formatCompletionRatio, getPathCourseStatusLabel } from '../../utils/path-people-utils';

  interface Props {
    detail: PathMemberDetail;
  }

  let { detail }: Props = $props();
</script>

<Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
  <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <div class="flex items-center gap-2">
      <h2 class="text-sm font-semibold">{$t('learningPath.analytics.member.courses_title')}</h2>
      <Badge variant="outline" class="ui:tabular-nums">{detail.courses.length}</Badge>
    </div>
    {#if detail.courses.length > 0}
      <div class="flex w-full items-center gap-2 sm:w-48">
        <Progress value={detail.member.progressPercent ?? 0} class="ui:h-1.5" />
        <span class="ui:tabular-nums ui:text-muted-foreground w-12 shrink-0 text-right text-xs">
          {detail.member.progressPercent ?? 0}%
        </span>
      </div>
    {/if}
  </div>
  <Separator.Root />

  {#if detail.courses.length === 0}
    <Empty.Root class="ui:py-10">
      <Empty.Header>
        <Empty.Media variant="icon">
          <BookOpenIcon class="custom" />
        </Empty.Media>
        <Empty.Title>{$t('learningPath.analytics.empty')}</Empty.Title>
      </Empty.Header>
    </Empty.Root>
  {:else}
    <ResourceListRow.Group class="ui:rounded-none ui:border-0">
      {#each detail.courses as course (course.learningPathCourseId)}
        <ResourceListRow.Root variant="default" align="start" class="ui:py-3">
          <ResourceListRow.Lead class="ui:self-start">
            <div
              class="ui:bg-primary/10 ui:text-primary flex size-9 items-center justify-center rounded-sm text-sm font-semibold"
            >
              {course.order}
            </div>
          </ResourceListRow.Lead>
          <ResourceListRow.Main class="ui:gap-1">
            <a href={`/courses/${course.courseId}`} class="line-clamp-1 text-sm font-semibold hover:underline">
              {course.title}
            </a>
          </ResourceListRow.Main>
          <ResourceListRow.End class="ui:gap-6 ui:self-start">
            <div class="flex w-20 justify-end">
              {#if course.status === 'COMPLETED'}
                <Badge variant="success" class="ui:tabular-nums">
                  {formatCompletionRatio(
                    course.lessonsCompleted + course.exercisesCompleted,
                    course.lessonsTotal + course.exercisesTotal
                  )}
                </Badge>
              {:else}
                <span class="ui:tabular-nums ui:text-muted-foreground text-sm">
                  {formatCompletionRatio(
                    course.lessonsCompleted + course.exercisesCompleted,
                    course.lessonsTotal + course.exercisesTotal
                  )}
                </span>
              {/if}
            </div>
            <div class="flex w-32 justify-end">
              {#if course.status === 'COMPLETED'}
                <Badge variant="success">
                  {getPathCourseStatusLabel(course.status)}
                </Badge>
              {:else if course.status === 'IN_PROGRESS'}
                <Badge variant="secondary">{getPathCourseStatusLabel(course.status)}</Badge>
              {:else}
                <Badge variant="outline">{getPathCourseStatusLabel(course.status)}</Badge>
              {/if}
            </div>
          </ResourceListRow.End>
        </ResourceListRow.Root>
      {/each}
    </ResourceListRow.Group>
  {/if}
</Card.Root>
