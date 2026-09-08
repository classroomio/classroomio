<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Separator from '@cio/ui/base/separator';
  import { Badge } from '@cio/ui/base/badge';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import ClockIcon from '@lucide/svelte/icons/clock';

  import { t } from '$lib/utils/functions/translations';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let {
    userCourseAnalytics
  }: {
    userCourseAnalytics: UserCourseAnalytics;
  } = $props();

  let exerciseCompletion = $derived(
    userCourseAnalytics.totalExercises === 0
      ? 0
      : Math.round((userCourseAnalytics.completedExercises / userCourseAnalytics.totalExercises) * 100)
  );

  function gradeLabel(grade: number | null): string {
    return grade === null ? '—' : `${grade}%`;
  }
</script>

<Card.Root class="ui:gap-4 ui:py-4 lg:sticky lg:top-4">
  <Card.Content class="flex flex-col items-center gap-3 text-center">
    <UserAvatar src={userCourseAnalytics.user.avatarUrl} alt={userCourseAnalytics.user.fullName} class="ui:size-20" />
    <div class="flex flex-col gap-1">
      <p class="text-base font-semibold">{userCourseAnalytics.user.fullName}</p>
      <p class="ui:text-muted-foreground text-sm break-all">{userCourseAnalytics.user.email}</p>
    </div>
    <Badge variant="secondary">
      <ClockIcon />
      {$t('analytics.last_seen')}
      {userCourseAnalytics.user.lastSeen ?? $t('analytics.a_while_ago')}
    </Badge>
  </Card.Content>

  <Separator.Root />

  <Card.Content class="flex flex-col items-center gap-1">
    <PercentRingProgress value={userCourseAnalytics.progressPercentage} size="default" />
    <p class="ui:text-muted-foreground text-xs">{$t('analytics.course_progress')}</p>
  </Card.Content>

  <Separator.Root />

  <Card.Content>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.lessons')}</span>
      <span class="ui:tabular-nums font-medium">
        {userCourseAnalytics.lessonsCompleted}/{userCourseAnalytics.lessonsCount}
      </span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.exercises')}</span>
      <span class="ui:tabular-nums font-medium">
        {userCourseAnalytics.completedExercises}/{userCourseAnalytics.totalExercises}
      </span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.assignment_completion')}</span>
      <span class="ui:tabular-nums font-medium">{exerciseCompletion}%</span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.average_grade')}</span>
      <span class="ui:tabular-nums font-medium">{gradeLabel(userCourseAnalytics.averageGrade)}</span>
    </div>
  </Card.Content>
</Card.Root>
