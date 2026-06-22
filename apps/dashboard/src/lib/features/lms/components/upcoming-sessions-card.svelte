<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { RadioIcon } from '@cio/ui/custom/moving-icons';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { t } from '$lib/utils/functions/translations';

  interface SessionItem {
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
    callUrl: string;
    lessonAt: string;
    timezone?: string | null;
  }

  let { sessions }: { sessions: SessionItem[] } = $props();

  function dateLabel(iso: string, tz?: string | null): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: tz || Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toUTCString();
    }
  }
</script>

{#if sessions.length}
  <section class="ui:bg-card ui:text-card-foreground ui:border-primary/30 rounded border p-4">
    <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold">
      <RadioIcon size={16} color="#ef4444" />
      {$t('dashboard.upcoming_sessions_heading')}
    </h3>

    <ul class="space-y-3">
      {#each sessions as session (session.lessonId)}
        <li class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{session.lessonTitle}</p>
            <p class="ui:text-muted-foreground flex items-center gap-1.5 truncate text-xs">
              <ClockIcon size={12} class="shrink-0" />
              {dateLabel(session.lessonAt, session.timezone)} · {session.courseTitle}
            </p>
          </div>
          <a href={session.callUrl} target="_blank" rel="noreferrer" class="shrink-0">
            <Button size="sm"><VideoIcon size={14} />{$t('course.navItem.lessons.session.join')}</Button>
          </a>
        </li>
      {/each}
    </ul>
  </section>
{/if}
