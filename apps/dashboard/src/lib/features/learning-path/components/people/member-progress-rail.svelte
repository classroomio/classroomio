<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Card from '@cio/ui/base/card';
  import * as Separator from '@cio/ui/base/separator';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import type { PathMemberDetail } from '../../utils/types';
  import { formatCompletionRatio, formatPathShortDate, getPathMemberDisplayEmail } from '../../utils/path-people-utils';

  interface Props {
    detail: PathMemberDetail;
  }

  let { detail }: Props = $props();

  const displayName = $derived(detail.member.fullName ?? getPathMemberDisplayEmail(detail.member));

  const completedCourses = $derived(detail.courses.filter((c) => c.status === 'COMPLETED').length);
</script>

<Card.Root class="ui:gap-4 ui:py-4 lg:sticky lg:top-4">
  <Card.Content class="flex flex-col items-center gap-3 text-center">
    <UserAvatar src={detail.member.avatarUrl} alt={displayName} class="ui:size-20" />
    <div class="flex flex-col gap-1">
      <p class="ui:text-foreground text-base font-semibold">{displayName}</p>
      <p class="ui:text-muted-foreground truncate text-sm">{getPathMemberDisplayEmail(detail.member)}</p>
    </div>
    <Badge variant="secondary">
      <ClockIcon class="custom" />
      {$t('analytics.last_seen')}
      {detail.member.lastActivityAt ? calDateDiff(detail.member.lastActivityAt) : $t('analytics.a_while_ago')}
    </Badge>
  </Card.Content>

  <Card.Content class="flex flex-col items-center gap-1">
    <PercentRingProgress value={detail.member.progressPercent ?? 0} size="default" />
    <p class="ui:text-muted-foreground text-xs">{$t('learningPath.analytics.member.progress_label')}</p>
  </Card.Content>

  <Separator.Root />

  <Card.Content>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('learningPath.analytics.member.courses_title')}</span>
      <span class="ui:tabular-nums font-medium">
        {formatCompletionRatio(completedCourses, detail.courses.length)}
      </span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('learningPath.people.table.current_course')}</span>
      <span class="ui:tabular-nums truncate font-medium">
        {detail.member.currentCourseTitle ?? '—'}
      </span>
    </div>
    <div class="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span class="ui:text-muted-foreground">{$t('learningPath.people.table.enrolled')}</span>
      <span class="ui:tabular-nums font-medium">
        {formatPathShortDate(detail.member.enrolledAt)}
      </span>
    </div>
  </Card.Content>
</Card.Root>
