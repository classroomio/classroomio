<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { GitBranch } from '@lucide/svelte';

  interface Props {
    href: string;
    title: string;
    coverGradient?: string;
    coverImage?: string;
    durationLabel: string;
    partOfPath?: { name: string; href: string } | null;
    ctaLabel: string;
  }

  let {
    href,
    title,
    coverGradient = 'linear-gradient(135deg, oklch(0.596 0.145 163.225), oklch(0.696 0.17 162.48))',
    coverImage,
    durationLabel,
    partOfPath = null,
    ctaLabel
  }: Props = $props();
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

    <span class="ui:text-muted-foreground inline-flex items-center gap-1 text-xs">
      <ClockIcon class="size-3.5" />
      {durationLabel}
    </span>

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
      <Button {href} variant="outline" size="sm" class="w-full">
        {ctaLabel}
        <ArrowRightIcon class="size-4" />
      </Button>
    </div>
  </div>
</div>
