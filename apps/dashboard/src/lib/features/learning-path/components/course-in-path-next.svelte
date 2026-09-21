<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LockIcon from '@lucide/svelte/icons/lock';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseInPathNextInfo } from './types';

  interface Props {
    pathHref: string;
    next?: CourseInPathNextInfo | null;
    isPathComplete?: boolean;
  }

  let { pathHref, next = null, isPathComplete = false }: Props = $props();
</script>

{#if next || isPathComplete}
  <div class="ui:border-border mt-6 overflow-hidden rounded-xl border">
    <div class="ui:bg-muted/50 ui:border-border flex items-center gap-2 border-b px-4 py-2.5">
      <PathIcon size={14} class="ui:text-primary" />
      <span class="ui:text-muted-foreground text-xs font-medium tracking-[0.06em] uppercase">
        {$t('learningPath.ribbon.next_in_path')}
      </span>
    </div>

    {#if next}
      <div class="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap sm:gap-4">
        <div class="ui:bg-muted ui:text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-lg">
          <LockIcon class="size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <span class="ui:text-muted-foreground text-[11px] font-semibold tracking-[0.06em] uppercase">
            {$t('learningPath.ribbon.next_course_position', { position: String(next.position) })}
          </span>
          <h4 class="truncate text-sm font-semibold">{next.title}</h4>
          <p class="ui:text-muted-foreground mt-0.5 text-xs">
            {$t('learningPath.ribbon.unlocks_after_finish', {
              lessons: String(next.remainingLessons),
              exercises: String(next.remainingExercises)
            })}
          </p>
        </div>
        <Button disabled variant="outline" size="sm" class="shrink-0">
          <LockIcon class="size-3.5" />
          {$t('learningPath.ribbon.locked')}
        </Button>
      </div>
    {:else}
      <div class="flex flex-wrap items-center justify-between gap-3 p-4">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          >
            <CheckIcon class="size-5" strokeWidth={2.5} />
          </div>
          <p class="ui:text-muted-foreground min-w-0 text-sm">{$t('learningPath.ribbon.path_complete')}</p>
        </div>
        <Button href={pathHref} variant="outline" size="sm" class="shrink-0">
          {$t('learningPath.ribbon.view_path')}
        </Button>
      </div>
    {/if}
  </div>
{/if}
