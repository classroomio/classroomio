<script lang="ts">
  import { resolve } from '$app/paths';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import HistoryIcon from '@lucide/svelte/icons/history';
  import PlayCircleIcon from '@lucide/svelte/icons/circle-play';
  import { Button } from '@cio/ui/base/button';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import type { CourseContentItem } from '$features/course/utils/types';
  import { getContentRoute } from '$features/course/utils/content';
  import { getPastLiveSessions, liveSessionClock } from '$features/course/utils/live-session-phase';
  import formatDate from '$lib/utils/functions/formatDate';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    courseId: string;
    items: CourseContentItem[];
  }

  let { courseId, items }: Props = $props();

  let open = $state(false);

  const pastSessions = $derived(getPastLiveSessions(items, $liveSessionClock));
</script>

{#if pastSessions.length > 0}
  <Collapsible.Root bind:open class="ui:border-border mb-5 rounded-lg border" data-testid="course-past-sessions">
    <Collapsible.Trigger class="flex w-full items-center gap-2 px-4 py-3 text-left">
      <HistoryIcon size={16} class="ui:text-muted-foreground" />
      <span class="flex-1 text-sm font-semibold">{$t('course.navItem.lessons.session.past_sessions_heading')}</span>
      <span class="ui:text-muted-foreground text-xs tabular-nums">{pastSessions.length}</span>
      <ChevronRightIcon size={16} class="ui:text-muted-foreground transition-transform {open ? 'rotate-90' : ''}" />
    </Collapsible.Trigger>
    <Collapsible.Content>
      <ul class="ui:border-border divide-y border-t">
        {#each pastSessions as session (session.id)}
          <li class="flex items-center gap-3 px-4 py-2.5">
            <div class="min-w-0 flex-1">
              <a href={resolve(getContentRoute(courseId, session), {})} class="block truncate text-sm hover:underline">
                {session.title}
              </a>
              <p class="ui:text-muted-foreground text-xs">{formatDate(session.lessonAt!)}</p>
            </div>
            {#if session.recordingUrl}
              <a href={session.recordingUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <PlayCircleIcon size={14} />
                  {$t('course.navItem.lessons.session.watch_recording')}
                </Button>
              </a>
            {/if}
          </li>
        {/each}
      </ul>
    </Collapsible.Content>
  </Collapsible.Root>
{/if}
