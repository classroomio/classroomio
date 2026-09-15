<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { Progress } from '@cio/ui/base/progress';
  import { PathIcon } from '@cio/ui/custom/moving-icons';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseStatus } from './types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
  import ClockIcon from '@lucide/svelte/icons/clock';

  interface Props {
    href: string;
    title: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    metaLabel: string;
    status: CourseStatus;
    progressPercent: number;
    partOfPath?: { name: string; href: string } | null;
  }

  let {
    href,
    title,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
    coverImage,
    metaLabel,
    status,
    progressPercent,
    partOfPath = null
  }: Props = $props();

  const done = $derived(status === 'COMPLETED');
</script>

<div
  class="ui:hover:border-primary/40 flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-[box-shadow,border-color] hover:shadow-md"
>
  <a
    {href}
    class="relative flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg"
    style="background: {coverGradient}"
    aria-label={title}
  >
    {#if coverImage}
      <img src={coverImage} alt={title} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
    {:else}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="size-8 text-white/30" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    {/if}
  </a>

  <div class="min-w-0 flex-1">
    <div class="mb-1 flex items-center gap-2">
      <LearningPathBadge type="course" />
    </div>
    <a {href} class="w-fit">
      <h3 class="ui:hover:text-primary truncate text-sm font-semibold">{title}</h3>
    </a>
    <p class="ui:text-muted-foreground mt-0.5 truncate text-xs">{description}</p>

    <div class="ui:text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span class="inline-flex items-center gap-1">
        <ClockIcon class="size-3.5" />
        {metaLabel}
      </span>
      {#if done}
        <Badge
          variant="outline"
          class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircleIcon class="size-3" />
          {$t('learningPath.enrollment.completed')}
        </Badge>
      {:else if status === 'IN_PROGRESS'}
        <Badge variant="outline" class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary">
          {$t('learningPath.enrollment.in_progress')}
        </Badge>
      {:else}
        <Badge variant="outline" class="ui:text-muted-foreground">
          {$t('learningPath.enrollment.not_started')}
        </Badge>
      {/if}
      {#if partOfPath}
        <span class="inline-flex items-center gap-1.5">
          <PathIcon class="size-3.5 shrink-0" />
          {$t('learningPath.course.part_of')}:
          <a href={partOfPath.href} class="ui:text-foreground ui:hover:text-primary font-medium">
            <strong>{partOfPath.name}</strong>
          </a>
        </span>
      {/if}
    </div>
  </div>

  <div class="flex w-40 shrink-0 flex-col items-end gap-2">
    <div class="flex w-full items-center gap-2">
      <Progress value={progressPercent} class="h-1.5 flex-1 rounded-full" />
      <span class="tnum w-9 shrink-0 text-right text-xs font-semibold {done ? 'text-emerald-600' : ''}"
        >{progressPercent}%</span
      >
    </div>
    <Button {href} variant={done ? 'outline' : 'default'} size="sm" class="shrink-0">
      {done ? $t('learningPath.course.review_course') : $t('learningPath.course.continue_course')}
      {#if !done}<ArrowRightIcon class="size-4" />{/if}
    </Button>
  </div>
</div>
