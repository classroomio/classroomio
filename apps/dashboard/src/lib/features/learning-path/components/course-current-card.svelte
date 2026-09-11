<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import LearningPathProgress from './learning-path-progress.svelte';
  import { t } from '$lib/utils/functions/translations';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';

  interface Props {
    href: string;
    title: string;
    description: string;
    coverGradient?: string;
    progressPercent: number;
    lessonCount: number;
    lessonsCompleted: number;
    durationHours?: number;
  }

  const hours = (value: number) => globalThis.Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(value);

  let {
    href,
    title,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    progressPercent,
    lessonCount,
    lessonsCompleted,
    durationHours = 0
  }: Props = $props();
</script>

<div class="hover:ui:border-ring flex flex-col overflow-hidden rounded-xl border transition-colors">
  <a
    {href}
    class="group relative flex h-28 items-center justify-center overflow-hidden"
    style="background: {coverGradient}"
    aria-label={title}
  >
    <BookIcon class="ui:text-white/30 size-14 transition-transform duration-300 group-hover:scale-110" />
    <LearningPathBadge type="course" onCover class="absolute top-3 left-3" />
  </a>

  <div class="flex flex-1 flex-col p-4">
    <a {href} class="w-fit">
      <h3 class="hover:ui:text-primary line-clamp-2 text-sm leading-snug font-semibold">{title}</h3>
    </a>

    {#if durationHours > 0}
      <div class="ui:text-muted-foreground mt-1.5 flex items-center gap-3 text-xs">
        <span class="inline-flex items-center gap-1">
          <ClockIcon class="size-3.5" />
          ~{hours(durationHours)}h
        </span>
      </div>
    {/if}

    <p class="ui:text-muted-foreground mt-2 line-clamp-2 text-xs leading-relaxed">{description}</p>

    <div class="mt-4 flex flex-1 flex-col justify-end">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="ui:text-muted-foreground text-xs">{$t('learningPath.progress.label')}</span>
        <span class="tnum text-xs font-semibold">{progressPercent}%</span>
      </div>
      <LearningPathProgress value={progressPercent} class="mb-3" />
    </div>

    <div class="flex items-center justify-between gap-2">
      <span class="tnum ui:text-muted-foreground text-xs">
        {$t('dashboard.lessons_done', { completed: lessonsCompleted, total: lessonCount })}
      </span>
      <Button {href} variant="outline" size="sm" class="shrink-0">
        {$t('dashboard.continue_course')}
      </Button>
    </div>
  </div>
</div>
