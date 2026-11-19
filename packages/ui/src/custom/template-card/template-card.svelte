<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { cn } from '../../tools';
  import { Badge } from '../../base/badge';
  import { Skeleton } from '../../base/skeleton';
  import { onDestroy } from 'svelte';
  import { Waves } from '../animation/waves';

  const BLANK_HOVER_TRANSITION_MS = 300;

  interface Props {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    imageAlt?: string;
    blank?: boolean;
    loading?: boolean;
    typeBadge?: {
      label: string;
      icon: Component;
    };
    class?: string;
    onclick?: (event: MouseEvent) => void;
    overlay?: Snippet;
  }

  let {
    title = '',
    subtitle = '',
    imageUrl,
    imageAlt = '',
    blank = false,
    loading = false,
    typeBadge,
    class: className = '',
    onclick,
    overlay
  }: Props = $props();

  let isBlankActive = $state(false);
  let showWaves = $state(false);
  let hideWavesTimer: ReturnType<typeof setTimeout> | undefined;

  function setBlankActive(active: boolean) {
    if (!blank) return;

    clearTimeout(hideWavesTimer);

    if (active) {
      showWaves = true;
      requestAnimationFrame(() => {
        isBlankActive = true;
      });
      return;
    }

    isBlankActive = false;
    hideWavesTimer = setTimeout(() => {
      showWaves = false;
    }, BLANK_HOVER_TRANSITION_MS);
  }

  onDestroy(() => clearTimeout(hideWavesTimer));
</script>

<div class={cn('ui:group ui:relative ui:w-full ui:min-w-0', className)}>
  {#if loading}
    <div class="ui:flex ui:flex-col ui:gap-2">
      <Skeleton class="ui:aspect-[16/10] ui:w-full" />
      <Skeleton class="ui:h-4 ui:w-3/4" />
      <Skeleton class="ui:h-3 ui:w-1/2" />
    </div>
  {:else}
    {@render overlay?.()}
    <button
      type="button"
      class="ui:flex ui:w-full ui:cursor-pointer ui:flex-col ui:gap-2 ui:rounded-md ui:text-left ui:focus-visible:ring-ring ui:focus-visible:outline-none ui:focus-visible:ring-2"
      {onclick}
      onmouseenter={() => setBlankActive(true)}
      onmouseleave={() => setBlankActive(false)}
      onfocus={() => setBlankActive(true)}
      onblur={() => setBlankActive(false)}
    >
      <span
        class={cn(
          'ui:relative ui:block ui:aspect-[16/10] ui:w-full ui:overflow-hidden ui:rounded-md ui:border ui:transition-colors',
          blank
            ? 'ui:border-primary ui:bg-background ui:border-dashed'
            : 'ui:border-border ui:bg-muted ui:group-hover:border-primary ui:group-focus-within:border-primary'
        )}
      >
        {#if blank}
          <span
            class={cn(
              'ui:pointer-events-none ui:absolute ui:inset-0 ui:bg-primary ui:transition-opacity ui:duration-300 ui:ease-in-out',
              isBlankActive ? 'ui:opacity-100' : 'ui:opacity-0'
            )}
            aria-hidden="true"
          ></span>
          {#if showWaves}
            <div
              class={cn(
                'ui:absolute ui:inset-0 ui:transition-opacity ui:duration-300 ui:ease-in-out',
                isBlankActive ? 'ui:opacity-100' : 'ui:opacity-0'
              )}
            >
              <Waves
                lineColor="rgba(255,255,255,0.55)"
                xGap={8}
                yGap={12}
                waveAmpX={18}
                waveAmpY={9}
                waveSpeedX={0.04}
                waveSpeedY={0.02}
              />
            </div>
          {/if}
          <span
            class={cn(
              'ui:absolute ui:inset-0 ui:z-10 ui:flex ui:items-center ui:justify-center ui:transition-colors ui:duration-300 ui:ease-in-out',
              isBlankActive ? 'ui:text-white' : 'ui:text-primary'
            )}
          >
            <PlusIcon class="ui:size-6 custom" />
          </span>
        {:else if imageUrl}
          <img
            src={imageUrl}
            alt={imageAlt}
            class="ui:h-full ui:w-full ui:object-cover ui:transition-transform ui:duration-300 ui:ease-out ui:group-hover:scale-105"
          />
        {/if}

        {#if typeBadge}
          {@const Icon = typeBadge.icon}
          <Badge variant="secondary" class="ui:absolute ui:bottom-2 ui:left-2 ui:z-10 ui:capitalize">
            <Icon class="ui:size-3" />
            {typeBadge.label}
          </Badge>
        {/if}
      </span>

      <span class="ui:flex ui:min-w-0 ui:flex-col ui:gap-0.5">
        <span class="ui:truncate ui:text-sm ui:font-medium">{title}</span>
        {#if subtitle}
          <span class="ui:text-muted-foreground ui:truncate ui:text-xs">{subtitle}</span>
        {/if}
      </span>
    </button>
  {/if}
</div>
