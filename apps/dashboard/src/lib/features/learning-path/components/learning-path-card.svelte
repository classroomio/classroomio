<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import LearningPathProgress from './learning-path-progress.svelte';
  import { t } from '$lib/utils/functions/translations';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import CertificateIcon from '@lucide/svelte/icons/badge-check';

  interface Props {
    href: string;
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    totalHours: number;
    progressPercent: number;
    coursesCompleted: number;
    certificateEarned?: boolean;
  }

  const hours = (totalHours: number) =>
    globalThis.Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(totalHours);

  let {
    href,
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    totalHours,
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

<div
  class="ui:hover:border-primary/40 flex flex-col overflow-hidden rounded-xl border shadow-sm transition-[box-shadow,border-color] hover:shadow-md"
>
  <a
    {href}
    class="group relative flex h-28 items-center justify-center overflow-hidden"
    style="background: {coverGradient}"
    aria-label={name}
  >
    {#if coverImage}
      <img
        src={coverImage}
        alt={name}
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    {/if}
    <LearningPathBadge type="path" onCover class="absolute top-3 left-3" />
  </a>

  <div class="flex flex-1 flex-col gap-2 p-4">
    <a {href} class="w-fit">
      <h3 class="ui:hover:text-primary line-clamp-2 text-sm leading-snug font-semibold">{name}</h3>
    </a>

    <p class="ui:text-muted-foreground line-clamp-2 h-10 text-xs leading-relaxed">
      {description}
    </p>

    <div class="ui:text-muted-foreground flex items-center gap-3 text-xs">
      <span class="inline-flex items-center gap-1">
        <BookIcon class="size-3.5" />
        {courseCount}
        {courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
      </span>
      {#if done}
        <span class="inline-flex items-center gap-1">
          <CertificateIcon class="size-3.5" />
          {$t('learningPath.card.certificate_earned')}
        </span>
      {:else}
        <span class="inline-flex items-center gap-1">
          <ClockIcon class="size-3.5" />
          ~{hours(totalHours)}h
        </span>
      {/if}
    </div>

    <div class="mt-2">
      <div class="mb-1.5 flex items-center justify-between">
        <span class="ui:text-muted-foreground text-xs">{$t('learningPath.progress.label')}</span>
        <span class="tnum text-xs font-semibold {done ? 'text-emerald-600' : ''}">{progressPercent}%</span>
      </div>
      <LearningPathProgress value={progressPercent} />
      <p class="tnum ui:text-muted-foreground mt-1.5 text-xs">
        {coursesCompleted}
        <span class="normal-case">{$t('learningPath.card.of')}</span>
        {courseCount}
        {$t('learningPath.hero.courses_completed')}
      </p>
    </div>

    <div class="mt-1 flex flex-1 items-end">
      <Button href={done ? '/lms/certificates' : href} variant={done ? 'outline' : 'default'} size="sm" class="w-full">
        {ctaLabel}
      </Button>
    </div>
  </div>
</div>
