<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Progress } from '@cio/ui/base/progress';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type { CourseStatus } from './types';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle-2';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import { GitBranch } from '@lucide/svelte';

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
  class="ui:hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-[box-shadow,border-color] hover:shadow-md"
>
  <div class="relative flex h-[86px] items-center justify-center overflow-hidden" style="background: {coverGradient}">
    {#if coverImage}
      <img src={coverImage} alt={title} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
    {/if}
    <LearningPathBadge type="course" onCover class="absolute top-[11px] left-[13px]" />
  </div>

  <div class="flex flex-1 flex-col gap-[9px] p-4">
    <a {href} class="w-fit">
      <h3 class="ui:hover:text-primary line-clamp-2 text-sm font-semibold tracking-tight">{title}</h3>
    </a>
    <p class="ui:text-muted-foreground line-clamp-2 min-h-[33px] text-xs leading-snug">{description}</p>

    <span class="ui:text-muted-foreground inline-flex items-center gap-1 text-xs">
      <ClockIcon class="size-3.5" />
      {metaLabel}
    </span>

    {#if done}
      <span class="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircleIcon class="size-3.5" strokeWidth={2.4} />
        {$t('learningPath.course.completed_label')}
      </span>
    {:else}
      <div class="flex items-baseline justify-between text-xs">
        <span class="ui:text-muted-foreground">{$t('learningPath.progress.label')}</span>
        <span class="tnum font-semibold">{progressPercent}%</span>
      </div>
      <Progress value={progressPercent} class="h-1.5 rounded-full" />
    {/if}

    {#if partOfPath}
      <span class="ui:text-muted-foreground inline-flex items-center gap-1.5 text-xs">
        <GitBranch size={14} />
        {$t('learningPath.course.part_of')}:
        <a href={partOfPath.href} class="ui:text-foreground ui:hover:text-primary font-medium">
          <strong>{partOfPath.name}</strong>
        </a>
      </span>
    {/if}

    <div class="mt-1 flex flex-1 items-end">
      <Button {href} variant={done ? 'outline' : 'default'} size="sm" class="w-full">
        {done ? $t('learningPath.course.review_course') : $t('learningPath.course.continue_course')}
        {#if !done}<ArrowRightIcon class="size-4" />{/if}
      </Button>
    </div>
  </div>
</div>
