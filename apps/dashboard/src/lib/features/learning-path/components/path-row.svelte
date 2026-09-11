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
  class="group border-border bg-card hover:border-ring flex items-center gap-4 rounded-lg border p-3.5 transition hover:shadow-sm {path.status ===
  'ARCHIVED'
    ? 'opacity-75'
    : ''}"
>
  <a
    href={targetHref}
    class="hidden h-[46px] w-[64px] shrink-0 rounded-md sm:block"
    style="background: {gradientStyle}"
    aria-hidden="true"
  ></a>

  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="flex items-center gap-2">
      <PathBadge type="learning-path" variant="body" />
      <Badge variant={badgeVariant} class="text-xs font-medium">
        {statusLabel}
      </Badge>
    </div>

    <h3 class="text-foreground truncate text-[15px] font-semibold tracking-tight">
      <a href={targetHref} class="hover:underline">
        {path.name}
      </a>
    </h3>

    <p class="text-muted-foreground truncate text-xs">
      {path.description || ''}
    </p>

    <div class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-3 text-xs">
      <span class="flex items-center gap-1.5">
        <BookOpenIcon class="size-3.5" />
        {path.courseCount}
        {path.courseCount === 1 ? 'course' : 'courses'}
      </span>
      <span class="flex items-center gap-1.5">
        <UsersIcon class="size-3.5" />
        {#if path.status === 'DRAFT' && path.memberCount === 0}
          {$t('learningPath.listing.card.not_published')}
        {:else}
          {path.memberCount} {path.memberCount === 1 ? 'learner' : 'learners'}
        {/if}
      </span>
      <span>•</span>
      <span>{relativeUpdated}</span>
    </div>
  </div>

  <div class="flex shrink-0 items-center gap-4">
    <div class="hidden w-[130px] items-center gap-2.5 md:flex">
      <div class="bg-muted h-1.5 w-[90px] shrink-0 overflow-hidden rounded-full">
        <div class="bg-primary h-full rounded-full" style="width: {path.completionRate}%"></div>
      </div>
      <span class="text-primary text-xs font-bold tabular-nums">
        {path.completionRate}%
      </span>
    </div>

    <Button href={targetHref} variant={isDraftSetup ? 'outline' : 'primary'} size="sm">
      {ctaText === 'Manage' ? $t('learningPath.listing.card.manage') : $t('learningPath.listing.card.continue_setup')}
      <ArrowRightIcon class="ml-1 size-3.5" />
    </Button>
  </div>
</div>
