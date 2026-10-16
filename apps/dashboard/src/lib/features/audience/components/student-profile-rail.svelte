<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import * as Separator from '@cio/ui/base/separator';
  import { Badge } from '@cio/ui/base/badge';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import ClockIcon from '@lucide/svelte/icons/clock';

  import { t } from '$lib/utils/functions/translations';
  import type { AudienceAnalytics, AudienceAnalyticsCourse } from '../utils/types';
  import { formatLastSeen } from '../utils/audience-utils';

  let {
    analytics
  }: {
    analytics: AudienceAnalytics;
  } = $props();

  function isComplete(c: AudienceAnalyticsCourse): boolean {
    const record = c as Record<string, unknown>;
    const asNumber = (value: unknown) => (typeof value === 'number' ? value : 0);
    const lessonsCount = asNumber(record.lessons_count ?? record.lessonCount);
    const lessonsCompleted = asNumber(record.lessons_completed ?? record.progressRate);
    const activitiesCount = asNumber(record.activities_count ?? record.activityCount);
    const activitiesCompleted = asNumber(record.activities_completed ?? record.activitiesCompleted);

    const totalRequired = lessonsCount + activitiesCount;
    if (totalRequired === 0) return false;

    const lessonsDone = lessonsCount === 0 || lessonsCompleted >= lessonsCount;
    const activitiesDone = activitiesCount === 0 || activitiesCompleted >= activitiesCount;
    return lessonsDone && activitiesDone;
  }

  function hasStarted(c: AudienceAnalyticsCourse): boolean {
    const record = c as Record<string, unknown>;
    const asNumber = (value: unknown) => (typeof value === 'number' ? value : 0);
    return (
      asNumber(record.lessons_completed ?? record.progressRate) > 0 ||
      asNumber(record.exercises_completed ?? record.exercisesCompleted) > 0 ||
      asNumber(record.activities_completed ?? record.activitiesCompleted) > 0
    );
  }

  let completedCourses = $derived(analytics.courses.filter(isComplete).length);
  let inProgressCourses = $derived(
    analytics.courses.filter((course) => !isComplete(course) && hasStarted(course)).length
  );

  function gradeLabel(grade: number | null): string {
    return grade === null ? '—' : `${grade}%`;
  }
</script>

<Card.Root class="ui:gap-4 ui:py-4 lg:sticky lg:top-4">
  <Card.Content class="flex flex-col items-center gap-3 text-center">
    <UserAvatar src={analytics.user.avatarUrl} alt={analytics.user.fullName} class="ui:size-20" />
    <div class="flex flex-col gap-1">
      <p class="text-base font-semibold">{analytics.user.fullName}</p>
      <p class="ui:text-muted-foreground text-sm break-all">{analytics.user.email}</p>
    </div>
    <Badge variant="secondary">
      <ClockIcon />
      {$t('analytics.last_seen')}
      {formatLastSeen(analytics.user.lastSeen)}
    </Badge>
  </Card.Content>

  <Separator.Root />

  <Card.Content class="flex flex-col items-center gap-1">
    <PercentRingProgress value={analytics.overallCourseProgress} size="default" />
    <p class="ui:text-muted-foreground text-xs">{$t('analytics.overall_course_progress')}</p>
  </Card.Content>

  <Separator.Root />

  <Card.Content>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.enrolled_courses')}</span>
      <span class="ui:tabular-nums font-medium">{analytics.courses.length}</span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.completed')}</span>
      <span class="ui:tabular-nums font-medium">{completedCourses}</span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('audience.user_analytics.in_progress')}</span>
      <span class="ui:tabular-nums font-medium">{inProgressCourses}</span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('analytics.average_grade')}</span>
      <span class="ui:tabular-nums font-medium">{gradeLabel(analytics.overallAverageGrade)}</span>
    </div>
  </Card.Content>
</Card.Root>
