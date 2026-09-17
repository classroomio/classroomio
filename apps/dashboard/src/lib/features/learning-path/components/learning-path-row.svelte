<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';
  import { LearningPathBadge } from '@cio/ui';
  import { Progress } from '@cio/ui/base/progress';
  import { t } from '$lib/utils/functions/translations';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import { Check } from '@lucide/svelte';

  interface Props {
    href: string;
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    progressPercent: number;
    coursesCompleted: number;
    certificateEarned?: boolean;
  }

  let {
    href,
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    progressPercent,
    coursesCompleted,
    certificateEarned = false
  }: Props = $props();

  const done = $derived(certificateEarned || (coursesCompleted === courseCount && courseCount > 0));
  const ctaLabel = $derived(
    done
      ? $t('learningPath.card.view_certificate')
      : coursesCompleted === 0
        ? $t('learningPath.hero.start_learning')
        : $t('learningPath.hero.continue_learning')
  );
</script>

<div class="ui:hover:border-primary/40 flex items-center gap-4 rounded-xl border p-4 transition-colors">
  <a
    {href}
    class="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10"
    style="background: {coverGradient}"
    aria-label={name}
  >
    {#if coverImage}
      <img src={coverImage} alt={name} loading="lazy" class="absolute inset-0 h-full w-full object-cover" />
    {/if}
  </a>

  <div class="min-w-0 flex-1">
    <div class="mb-1 flex items-center gap-2">
      <LearningPathBadge label={$t('learningPath.badge.learning_path')} />
    </div>
    <a {href} class="w-fit">
      <h3 class="ui:hover:text-primary truncate text-sm font-semibold">{name}</h3>
    </a>
    <p class="ui:text-muted-foreground mt-0.5 truncate text-xs">{description}</p>

    <div class="ui:text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      <span class="inline-flex items-center gap-1">
        <BookIcon class="size-3.5" />
        {courseCount}
        {courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
      </span>
      <span class="tnum inline-flex items-center gap-1">
        <Check class="size-3.5" />
        {coursesCompleted}
        {$t('learningPath.card.of')}
        {courseCount}
        {$t('learningPath.row.completed')}
      </span>
      {#if done}
        <Badge
          variant="outline"
          class="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <Check class="size-3" />
          {$t('learningPath.enrollment.completed')}
        </Badge>
      {:else if coursesCompleted === 0}
        <Badge variant="outline" class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary">
          {$t('learningPath.enrollment.not_started')}
        </Badge>
      {:else}
        <Badge variant="outline" class="ui:border-primary/30 ui:bg-primary/10 ui:text-primary">
          {$t('learningPath.enrollment.in_progress')}
        </Badge>
      {/if}
    </div>
  </div>

  <div class="flex w-40 shrink-0 flex-col items-end gap-2">
    <div class="flex w-full items-center gap-2">
      <Progress value={progressPercent} class="h-1.5 flex-1 rounded-full" />
      <span class="tnum w-9 shrink-0 text-right text-xs font-semibold">{progressPercent}%</span>
    </div>
    <Button href={done ? '/lms/certificates' : href} variant={done ? 'outline' : 'default'} size="sm" class="shrink-0">
      {ctaLabel}
    </Button>
  </div>
</div>
