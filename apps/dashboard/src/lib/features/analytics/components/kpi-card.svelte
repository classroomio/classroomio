<script lang="ts">
  import * as Card from '@cio/ui/base/card';
  import { Spinner } from '@cio/ui/base/spinner';
  import { cn } from '@cio/ui/tools';
  import type { Component } from 'svelte';

  interface Props {
    title: string;
    value: number | string;
    description?: string;
    icon?: Component;
    accent?: 'primary' | 'success' | 'warning' | 'danger';
    sparkline?: number[];
    loading?: boolean;
    class?: string;
  }

  let {
    title,
    value,
    description,
    icon: Icon,
    accent = 'primary',
    sparkline,
    loading = false,
    class: className
  }: Props = $props();

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
      <Card.Title class="ui:text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </Card.Title>
      {#if Icon}
        <div class={cn('flex h-9 w-9 items-center justify-center rounded-full', accentClass[accent])}>
          <Icon class="h-4 w-4" />
        </div>
      {/if}
    </div>
  </Card.Header>
  <Card.Content class="pt-0">
    {#if loading}
      <div class="flex h-9 items-center">
        <Spinner class="ui:text-muted-foreground size-5" />
      </div>
    {:else}
      <p class="ui:text-foreground text-3xl font-semibold tabular-nums">{value}</p>
    {/if}
    {#if description}
      <p class="ui:text-muted-foreground mt-1 text-xs">{description}</p>
    {/if}
    {#if sparklinePath && !loading}
      <svg viewBox="0 0 100 30" class="mt-3 h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d={sparklinePath} fill="none" stroke="currentColor" stroke-width="1.5" class="ui:text-primary" />
      </svg>
    {/if}
  </Card.Content>
</Card.Root>
