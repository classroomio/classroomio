<script lang="ts">
  import { PathBadge } from '@cio/ui';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import UsersIcon from '@lucide/svelte/icons/users';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { t } from '$lib/utils/functions/translations';
  import type { LearningPathSummary } from '../utils/types';
  import {
    getStatusBadgeVariant,
    getStatusDisplayLabel,
    formatPathCta,
    formatRelativeTime
  } from '../utils/learning-path-utils';

  interface Props {
    path: LearningPathSummary;
    basePath: string;
  }

  let { path, basePath }: Props = $props();

  const isDraftSetup = $derived(path.status === 'DRAFT' && path.memberCount === 0);
  const targetHref = $derived(isDraftSetup ? `${basePath}/${path.id}/setup` : `${basePath}/${path.id}/courses`);
  const ctaText = $derived(formatPathCta(path));
  const badgeVariant = $derived(getStatusBadgeVariant(path.status));
  const statusLabel = $derived(getStatusDisplayLabel(path.status));
  const relativeUpdated = $derived(formatRelativeTime(path.updatedAt));
  const gradientStyle = $derived(
    path.gradient || 'linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815))'
  );
</script>

<div
  class="group border-border bg-card hover:border-ring flex flex-col overflow-hidden rounded-lg border transition hover:shadow-md {path.status ===
  'ARCHIVED'
    ? 'opacity-75'
    : ''}"
>
  <a href={targetHref} class="relative block h-[84px] w-full" style="background: {gradientStyle}">
    <div class="absolute top-2.5 left-3">
      <PathBadge type="learning-path" variant="cover" />
    </div>
  </a>

  <div class="flex flex-1 flex-col gap-2.5 p-4">
    <div class="flex items-start justify-between gap-2.5">
      <h3 class="text-foreground line-clamp-1 text-[15.5px] font-semibold tracking-tight">
        <a href={targetHref} class="hover:underline">
          {path.name}
        </a>
      </h3>
      <Badge variant={badgeVariant} class="shrink-0 text-xs font-medium">
        {statusLabel}
      </Badge>
    </div>

    <p class="text-muted-foreground line-clamp-2 min-h-[33px] text-[12.5px] leading-snug">
      {path.description || ''}
    </p>

    <div class="text-muted-foreground flex items-center gap-3.5 text-xs">
      <span class="flex items-center gap-1.5">
        <BookOpenIcon class="size-3.5 stroke-2" />
        {path.courseCount}
        {path.courseCount === 1 ? 'course' : 'courses'}
      </span>
      <span class="flex items-center gap-1.5">
        <UsersIcon class="size-3.5 stroke-2" />
        {#if path.status === 'DRAFT' && path.memberCount === 0}
          {$t('learningPath.listing.card.not_published')}
        {:else}
          {path.memberCount} {path.memberCount === 1 ? 'learner' : 'learners'}
        {/if}
      </span>
    </div>

    <div>
      <div class="flex items-baseline justify-between text-[12.5px]">
        <span class="text-muted-foreground font-medium">
          {$t('learningPath.listing.card.completion')}
        </span>
        <span class="text-primary text-sm font-bold tabular-nums">
          {path.completionRate}%
        </span>
      </div>
      <div class="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
        <div
          class="bg-primary h-full rounded-full transition-all duration-300"
          style="width: {path.completionRate}%"
        ></div>
      </div>
    </div>

    <div class="text-muted-foreground text-[11.5px]">
      {relativeUpdated}
    </div>

    <Button href={targetHref} variant={isDraftSetup ? 'outline' : 'primary'} class="mt-0.5 w-full justify-center">
      {ctaText === 'Manage' ? $t('learningPath.listing.card.manage') : $t('learningPath.listing.card.continue_setup')}
      <ArrowRightIcon class="ml-1.5 size-4" />
    </Button>
  </div>
</div>
