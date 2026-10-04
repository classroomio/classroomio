<script module lang="ts">
  import type { BlockLoaderBlock, BlockLoaderTone } from './types';

  const DEFAULT_BLOCKS: BlockLoaderBlock[] = [
    { kind: 'LESSON', title: 'Getting started', tone: 'muted', width: 340 },
    { kind: 'LESSON', title: 'Invite your team', tone: 'tint', width: 300 },
    { kind: 'QUIZ', title: 'Setup check', tone: 'primary', width: 320 },
    { kind: 'CERTIFICATE', title: 'Certified admin', tone: 'dark', width: 280 }
  ];

  const FACE_CLASSES: Record<BlockLoaderTone, string> = {
    muted: 'ui:bg-muted ui:text-foreground',
    tint: 'ui:bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))] ui:text-foreground',
    primary: 'ui:bg-primary ui:text-primary-foreground',
    dark: 'ui:bg-foreground ui:text-background'
  };

  const TAB_CLASSES: Record<BlockLoaderTone, string> = {
    muted: 'ui:bg-muted',
    tint: 'ui:bg-[color-mix(in_srgb,var(--primary)_8%,var(--background))]',
    primary: 'ui:bg-primary',
    dark: 'ui:bg-foreground'
  };

  const KIND_CLASSES: Record<BlockLoaderTone, string> = {
    muted: 'ui:text-primary',
    tint: 'ui:text-primary',
    primary: 'ui:text-primary-foreground/70',
    dark: 'ui:text-background/70'
  };
</script>

<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    title?: string;
    caption?: string;
    label?: string;
    blocks?: BlockLoaderBlock[];
    class?: string;
  }

  let { title, caption, label, blocks = DEFAULT_BLOCKS, class: className }: Props = $props();

  const accessibleName = $derived(label ?? title);
</script>

<div role="status" aria-label={accessibleName} class={cn('ui:flex ui:flex-col ui:items-center ui:gap-7', className)}>
  <div aria-hidden="true" class="ui:pointer-events-none ui:flex ui:flex-col-reverse ui:items-start ui:gap-0.5">
    {#each blocks as block, index (index)}
      <div class="slot" style:--index={index} style:z-index={index + 1} style:width="{block.width}px">
        <div
          class="ui:notch-cutout ui:flex ui:h-16 ui:flex-col ui:gap-0.5 ui:rounded-[10px] ui:px-[18px] ui:pt-3.5 ui:[--notch-x:24px] {FACE_CLASSES[
            block.tone
          ]}"
        >
          <span class="ui:font-mono ui:text-[10px] ui:tracking-[0.12em] {KIND_CLASSES[block.tone]}">{block.kind}</span>
          <b class="ui:text-[15px] ui:font-semibold">{block.title}</b>
        </div>
        {#if index > 0}
          <span class="tab {TAB_CLASSES[block.tone]}"></span>
        {/if}
      </div>
    {/each}
  </div>

  {#if title || caption}
    <div class="ui:flex ui:flex-col ui:items-center ui:gap-1.5 ui:text-center">
      {#if title}
        <b class="ui:text-xl ui:font-semibold ui:tracking-tight">{title}</b>
      {/if}
      {#if caption}
        <span class="ui:text-muted-foreground ui:text-[15px]">{caption}</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .slot {
    position: relative;
    animation: drop 6s linear infinite both;
    animation-delay: calc(var(--index) * 0.84s - 0.12s);
  }

  .tab {
    position: absolute;
    bottom: -12px;
    left: 23.4px;
    width: 47.2px;
    height: 12px;
    clip-path: path('M0 0 H47.2 Q42.8 0 41.6 2.6 L39.2 9.4 Q38.4 12 35.6 12 H11.6 Q8.8 12 8 9.4 L5.6 2.6 Q4.4 0 0 0 Z');
  }

  @keyframes drop {
    0%,
    4% {
      transform: translateY(-90px);
      opacity: 0;
      animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.45);
    }
    12% {
      transform: none;
      opacity: 1;
      animation-timing-function: ease-out;
    }
    14% {
      transform: translateY(-5px);
    }
    16%,
    84% {
      transform: none;
      opacity: 1;
    }
    94%,
    100% {
      transform: translateY(-8px);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slot {
      animation: none;
    }
  }
</style>
