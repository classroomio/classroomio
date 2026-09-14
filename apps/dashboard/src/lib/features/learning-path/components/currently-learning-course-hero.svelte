<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import LearningPathProgress from './learning-path-progress.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BookIcon from '@lucide/svelte/icons/book-open';

  interface Props {
    title: string;
    href: string;
    coverGradient?: string;
    weeksLabel: string;
    partOfPathName?: string | null;
    pathHref?: string;
    progressPercent: number;
    lessonsLabel: string;
  }

  let {
    title,
    href,
    coverGradient = 'linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))',
    weeksLabel,
    partOfPathName = null,
    pathHref = '/lms/mylearning/learning-paths',
    progressPercent,
    lessonsLabel
  }: Props = $props();
</script>

<div
  class="ui:from-secondary ui:to-background flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br sm:flex-row"
>
  <a
    {href}
    class="group relative flex aspect-[10/8] w-full shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none sm:aspect-auto sm:w-56 md:w-64"
    style="background: {coverGradient}"
    aria-label={title}
    tabindex="-1"
  >
    <BookIcon class="ui:text-white/40 size-20 transition-transform duration-300 group-hover:scale-110" />
    <LearningPathBadge type="course" onCover class="absolute top-3 left-3" />
  </a>

  <div class="flex min-w-0 flex-1 flex-col gap-5 p-5 md:gap-6">
    <div class="flex min-w-0 flex-1 flex-col py-1">
      <a {href} class="w-fit">
        <h3 class="hover:ui:text-primary text-lg font-semibold tracking-tight">{title}</h3>
      </a>

      <p class="ui:text-muted-foreground mt-0.5 text-sm">
        {weeksLabel}
        {#if partOfPathName}
          <span class="inline-flex items-center gap-1">
            · {$t('learningPath.course.part_of')}:
            <a href={pathHref} class="ui:text-foreground hover:ui:text-primary font-medium">
              <strong>{partOfPathName}</strong>
            </a>
          </span>
        {/if}
      </p>

      <div class="mt-4 flex items-center justify-between gap-3">
        <span class="ui:text-muted-foreground text-sm font-medium">{$t('learningPath.progress.label')}</span>
        <span class="tnum text-sm font-bold">{progressPercent}%</span>
      </div>
      <LearningPathProgress value={progressPercent} class="mt-1.5" />

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
        <p class="tnum ui:text-muted-foreground min-w-0 flex-1 truncate text-xs">{lessonsLabel}</p>
        <Button {href} variant="default" size="default" class="shrink-0">
          {$t('learningPath.course.continue_course')}
          <ArrowRightIcon class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</div>
