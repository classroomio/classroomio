<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { LearningPathBadge, LearningPathProgress, DEFAULT_COURSE_BANNER_IMAGE } from '@cio/ui';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    progressPercent: number;
    coursesCompleted: number;
    href: string;
  }

  const ctaLabel = (completed: number, count: number) =>
    completed === count && count > 0
      ? $t('learningPath.hero.view_path')
      : completed === 0
        ? $t('learningPath.hero.start_learning')
        : $t('learningPath.hero.continue_learning');

  let {
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    progressPercent,
    coursesCompleted,
    href
  }: Props = $props();
</script>

<div class="flex flex-col overflow-hidden rounded-2xl border sm:flex-row">
  <!-- Cover — flush to the left edge -->
  <a
    {href}
    class="group ui:bg-card relative flex aspect-[10/8] w-full shrink-0 items-center justify-center overflow-hidden focus-visible:outline-none sm:aspect-auto sm:w-56 md:w-64"
    aria-label={name}
    tabindex="-1"
  >
    {#if coverImage}
      <img
        src={coverImage}
        alt={name}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    {:else}
      <img
        src={DEFAULT_COURSE_BANNER_IMAGE}
        alt={name}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover"
      />
    {/if}
    <LearningPathBadge label={$t('learningPath.badge.learning_path')} onCover class="absolute top-3 left-3" />
  </a>

  <!-- Content -->
  <div class="flex min-w-0 flex-1 flex-col gap-5 p-5 md:gap-6">
    <div class="flex min-w-0 flex-1 flex-col py-1">
      <a {href} class="w-fit">
        <h3 class="ui:hover:text-primary text-lg font-semibold tracking-tight">{name}</h3>
      </a>
      <p class="ui:text-muted-foreground mt-0.5 text-sm">
        {courseCount}
        {courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
      </p>

      <div class="mt-4 flex items-center justify-between gap-3">
        <span class="ui:text-muted-foreground text-sm font-medium">{$t('learningPath.progress.label')}</span>
        <span class="tnum text-sm font-bold">{progressPercent}%</span>
      </div>
      <LearningPathProgress value={progressPercent} class="mt-1.5" />

      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
        <p class="tnum ui:text-muted-foreground min-w-0 flex-1 truncate text-xs">
          {coursesCompleted}
          <span class="normal-case">{$t('learningPath.card.of')}</span>
          {courseCount}
          {$t('learningPath.hero.courses_completed')}
        </p>
        <Button {href} variant="default" size="default" class="shrink-0">
          {ctaLabel(coursesCompleted, courseCount)}
        </Button>
      </div>
    </div>
  </div>
</div>
