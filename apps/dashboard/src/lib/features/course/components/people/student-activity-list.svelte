<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Separator from '@cio/ui/base/separator';
  import { Badge } from '@cio/ui/base/badge';
  import { Progress } from '@cio/ui/base/progress';
  import CircleCheckIcon from '@lucide/svelte/icons/circle-check-big';
  import CircleDashedIcon from '@lucide/svelte/icons/circle-dashed';
  import PackageIcon from '@lucide/svelte/icons/package';

  import { t } from '$lib/utils/functions/translations';
  import { formatScorePercent } from '$features/course/utils/scorm-utils';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let {
    courseId,
    userCourseAnalytics
  }: {
    courseId: string;
    userCourseAnalytics: UserCourseAnalytics;
  } = $props();

  let activities = $derived(userCourseAnalytics.userActivitiesStats ?? []);
  let completedActivities = $derived(activities.filter((activity) => activity.isComplete).length);
  let totalActivities = $derived(activities.length);
  let activityCompletion = $derived(
    totalActivities === 0 ? 0 : Math.round((completedActivities / totalActivities) * 100)
  );
</script>

{#if totalActivities > 0}
  <Card.Root class="ui:gap-0 ui:overflow-hidden ui:py-0">
    <div class="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold">{$t('audience.user_analytics.activities_title')}</h2>
        <Badge variant="outline" class="ui:tabular-nums">{totalActivities}</Badge>
      </div>
      <div class="flex w-full items-center gap-2 sm:w-48">
        <Progress value={activityCompletion} class="ui:h-1.5" />
        <span class="ui:tabular-nums ui:text-muted-foreground w-12 shrink-0 text-right text-xs">
          {completedActivities}/{totalActivities}
        </span>
      </div>
    </div>
    <Separator.Root />

    <ResourceListRow.Group class="ui:rounded-none ui:border-0">
      {#each activities as activity (activity.id)}
        <ResourceListRow.Root variant="default" align="start" class="ui:py-3">
          <ResourceListRow.Lead class="ui:self-start">
            <div class="ui:bg-muted ui:text-muted-foreground flex size-9 items-center justify-center rounded-sm">
              <PackageIcon class="size-4" />
            </div>
          </ResourceListRow.Lead>
          <ResourceListRow.Main class="ui:gap-1">
            <a
              href={`/courses/${courseId}/activities/${activity.id}?tab=results`}
              class="line-clamp-1 text-sm font-semibold hover:underline"
            >
              {activity.title}
            </a>
            <span class="ui:text-muted-foreground text-xs">{$t('audience.user_analytics.scorm_package')}</span>
          </ResourceListRow.Main>
          <ResourceListRow.End class="ui:gap-6 ui:self-start">
            <div class="flex w-20 justify-end">
              <span class="ui:tabular-nums ui:text-muted-foreground text-sm">
                {formatScorePercent(activity.bestScorePercent ?? activity.scorePercent)}
              </span>
            </div>
            <div class="flex w-32 justify-end">
              {#if activity.isComplete}
                <Badge variant="success">
                  <CircleCheckIcon />
                  {$t('audience.user_analytics.activity_status.completed')}
                </Badge>
              {:else if activity.attempts > 0}
                <Badge variant="secondary">
                  <CircleDashedIcon />
                  {$t('audience.user_analytics.activity_status.in_progress')}
                </Badge>
              {:else}
                <Badge variant="outline">{$t('audience.user_analytics.activity_status.not_started')}</Badge>
              {/if}
            </div>
          </ResourceListRow.End>
        </ResourceListRow.Root>
      {/each}
    </ResourceListRow.Group>
  </Card.Root>
{/if}
