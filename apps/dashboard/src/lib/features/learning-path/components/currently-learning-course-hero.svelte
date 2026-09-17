<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { LearningPathBadge, LearningPathProgress } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import BookIcon from '@lucide/svelte/icons/book-open';

  interface Props {
    title: string;
    href: string;
    coverGradient?: string;
    coverImage?: string;
    partOfPathName?: string | null;
    pathHref?: string;
    progressPercent: number;
    lessonsLabel: string;
  }

  let {
    title,
    href,
    coverGradient = 'linear-gradient(135deg, oklch(0.685 0.169 237.323), oklch(0.488 0.243 264.376))',
    coverImage,
    partOfPathName = null,
    pathHref = '/lms/mylearning',
    progressPercent,
    lessonsLabel
  }: Props = $props();
</script>

<div class="flex flex-col overflow-hidden rounded-2xl border sm:flex-row">
  <a
    {href}
    class="group relative flex aspect-[10/8] w-full shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none sm:aspect-auto sm:w-56 md:w-64"
    style="background: {coverGradient}"
    aria-label={title}
    tabindex="-1"
  >
    {#if coverImage}
      <img
        src={coverImage}
        alt={title}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    {:else}
      <BookIcon class="size-20 text-white/40 transition-transform duration-300 group-hover:scale-110" />
    {/if}
    <LearningPathBadge label={$t('learningPath.badge.course')} onCover class="absolute top-3 left-3" />
  </a>

  <div class="flex min-w-0 flex-1 flex-col gap-5 p-5 md:gap-6">
    <div class="flex min-w-0 flex-1 flex-col py-1">
      <a {href} class="w-fit">
        <h3 class="ui:hover:text-primary text-lg font-semibold tracking-tight">{title}</h3>
      </a>

      <p class="ui:text-muted-foreground mt-0.5 text-sm">
        {#if partOfPathName}
          <span class="inline-flex items-center gap-1">
            · {$t('learningPath.course.part_of')}:
            <a href={pathHref} class="ui:text-foreground ui:hover:text-primary font-medium">
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
