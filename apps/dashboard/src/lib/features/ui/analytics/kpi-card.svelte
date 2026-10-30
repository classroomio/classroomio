<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { cn } from '@cio/ui/tools';
  import type { Component, Snippet } from 'svelte';

  interface Props {
    title: string;
    value: number | string;
    description?: string;
    trend?: 'up' | 'down' | 'flat';
    icon?: Component;
    accent?: 'primary' | 'success' | 'warning' | 'danger';
    sparkline?: number[];
    badge?: Snippet;
    loading?: boolean;
    class?: string;
  }

  let {
    title,
    value,
    description,
    trend = 'flat',
    icon: Icon,
    accent = 'primary',
    sparkline,
    badge,
    loading = false,
    class: className
  }: Props = $props();

  const trendClass: Record<NonNullable<Props['trend']>, string> = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    flat: 'ui:text-muted-foreground'
  };

  const accentClass: Record<NonNullable<Props['accent']>, string> = {
    primary: 'ui:bg-primary/10 ui:text-primary',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
  };

  const sparklinePath = $derived.by(() => {
    if (!sparkline || sparkline.length < 2) return '';
    const max = Math.max(...sparkline, 1);
    const min = Math.min(...sparkline, 0);
    const span = max - min || 1;
    const width = 100;
    const height = 30;
    return sparkline
      .map((value, index) => {
        const x = (index / (sparkline.length - 1)) * width;
        const y = height - ((value - min) / span) * height;
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  });
</script>

<Card.Root class={cn('ui:bg-card relative overflow-hidden', className)}>
  <Card.Header class="pb-2">
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-2">
        <Card.Title class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {title}
        </Card.Title>
        {@render badge?.()}
      </div>
      {#if Icon}
        <div class={cn('flex h-9 w-9 items-center justify-center rounded-full', accentClass[accent])}>
          <Icon class="h-4 w-4" />
        </div>
      {/if}
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    {#if loading}
      <Skeleton class="h-9 w-24" />
    {:else}
      <p class="ui:text-foreground text-3xl font-semibold tabular-nums">{value}</p>
    {/if}
    {#if description}
      {#if loading}
        <Skeleton class="mt-2 h-3 w-32" />
      {:else}
        <p class={cn('mt-1 text-xs tabular-nums', trendClass[trend])}>{description}</p>
      {/if}
    {/if}
    {#if sparklinePath && !loading}
      <svg viewBox="0 0 100 30" class="mt-3 h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d={sparklinePath} fill="none" stroke="currentColor" stroke-width="1.5" class="ui:text-primary" />
      </svg>
    {/if}
  </Card.Content>
</Card.Root>
