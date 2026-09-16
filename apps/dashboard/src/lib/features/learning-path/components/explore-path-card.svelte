<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import LearningPathBadge from './learning-path-badge.svelte';
  import { t } from '$lib/utils/functions/translations';
  import BookIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  interface Props {
    href: string;
    name: string;
    description: string;
    coverGradient?: string;
    coverImage?: string;
    courseCount: number;
    durationLabel: string;
    ctaLabel: string;
  }

  let {
    href,
    name,
    description,
    coverGradient = 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))',
    coverImage,
    courseCount,
    durationLabel,
    ctaLabel
  }: Props = $props();
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

  <div class="flex flex-1 flex-col gap-[9px] p-4">
    <a {href} class="w-fit">
      <h3 class="ui:hover:text-primary line-clamp-2 text-sm font-semibold tracking-tight">{name}</h3>
    </a>

    <p class="ui:text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</p>

    <div class="ui:text-muted-foreground flex items-center gap-3 text-xs">
      <span class="inline-flex items-center gap-1">
        <BookIcon class="size-3.5" />
        {courseCount}
        {courseCount === 1 ? $t('learningPath.card.course') : $t('learningPath.card.courses')}
      </span>
      <span class="inline-flex items-center gap-1">
        <ClockIcon class="size-3.5" />
        {durationLabel}
      </span>
    </div>

    <div class="mt-1 flex flex-1 items-end">
      <Button {href} size="sm" class="w-full">
        {ctaLabel}
        <ArrowRightIcon class="size-4" />
      </Button>
    </div>
  </div>
</div>
