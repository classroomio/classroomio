<script lang="ts">
  import { cn } from '../../tools';
  import type {
    BlockStackAnimation,
    BlockStackBlock,
    BlockStackSize,
    BlockStackTone,
    BlockStackVariant,
    BlockStackWidth
  } from './types';

  interface Props {
    blocks: BlockStackBlock[];
    /** `true` plays the variant's default entrance; the `notch` variant also accepts `drop` or `settle`. */
    animate?: boolean | BlockStackAnimation;
    /** Accessible summary of the stack. The stack itself is decorative. */
    ariaLabel?: string;
    /** `notch` renders the brand's notched blocks, stacked bottom-up with the first block at the bottom. */
    variant?: BlockStackVariant;
    size?: BlockStackSize;
    class?: string;
  }

  let { blocks, animate = false, ariaLabel, variant = 'list', size = 'md', class: className }: Props = $props();

  const DROP_STAGGER_MS = 140;
  const DROP_STAGGER_GROUP = 4;
  const TAB_PATH =
    "path('M0 0 H47.2 Q42.8 0 41.6 2.6 L39.2 9.4 Q38.4 12 35.6 12 H11.6 Q8.8 12 8 9.4 L5.6 2.6 Q4.4 0 0 0 Z')";

  const widths: Record<BlockStackWidth, string> = {
    sm: 'ui:w-[45%]',
    md: 'ui:w-[62%]',
    lg: 'ui:w-[82%]',
    full: 'ui:w-full'
  };

  const listTones: Record<BlockStackTone, string> = {
    muted: 'ui:bg-muted ui:text-muted-foreground ui:border-border',
    primary: 'ui:bg-primary/10 ui:text-primary ui:border-primary/30',
    solid: 'ui:bg-primary ui:text-primary-foreground ui:border-primary',
    sand: 'ui:bg-muted ui:text-foreground ui:border-border',
    tint: 'ui:bg-primary/10 ui:text-foreground ui:border-primary/20',
    soft: 'ui:bg-primary/20 ui:text-foreground ui:border-primary/30',
    blue: 'ui:bg-primary ui:text-primary-foreground ui:border-primary',
    ink: 'ui:bg-foreground ui:text-background ui:border-foreground',
    empty: 'ui:bg-transparent ui:text-muted-foreground ui:border-dashed ui:border-muted-foreground/40'
  };

  const notchFaces: Record<BlockStackTone, string> = {
    muted: 'ui:bg-muted ui:text-foreground',
    sand: 'ui:bg-muted ui:text-foreground',
    tint: 'ui:bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))] ui:text-foreground',
    primary: 'ui:bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))] ui:text-foreground',
    soft: 'ui:bg-[color-mix(in_srgb,var(--primary)_17%,var(--background))] ui:text-foreground',
    blue: 'ui:bg-primary ui:text-primary-foreground',
    solid: 'ui:bg-primary ui:text-primary-foreground',
    ink: 'ui:bg-foreground ui:text-background',
    empty: 'ui:border-[1.5px] ui:border-dashed ui:border-muted-foreground/40 ui:bg-transparent ui:text-muted-foreground'
  };

  const notchKinds: Record<BlockStackTone, string> = {
    muted: 'ui:text-primary',
    sand: 'ui:text-primary',
    tint: 'ui:text-primary',
    primary: 'ui:text-primary',
    soft: 'ui:text-primary',
    blue: 'ui:text-[color-mix(in_srgb,var(--primary)_32%,white)]',
    solid: 'ui:text-[color-mix(in_srgb,var(--primary)_32%,white)]',
    ink: 'ui:text-[color-mix(in_srgb,var(--primary)_32%,white)]',
    empty: 'ui:text-muted-foreground'
  };

  const notchTabs: Record<BlockStackTone, string> = {
    muted: 'ui:bg-muted',
    sand: 'ui:bg-muted',
    tint: 'ui:bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))]',
    primary: 'ui:bg-[color-mix(in_srgb,var(--primary)_7%,var(--background))]',
    soft: 'ui:bg-[color-mix(in_srgb,var(--primary)_17%,var(--background))]',
    blue: 'ui:bg-primary',
    solid: 'ui:bg-primary',
    ink: 'ui:bg-foreground',
    empty: ''
  };

  const notchAnimation = $derived<BlockStackAnimation | null>(
    animate === true ? 'drop' : animate === false ? null : animate
  );

  function widthClass(width: BlockStackBlock['width'], fallback: BlockStackWidth) {
    return typeof width === 'number' ? '' : widths[width ?? fallback];
  }

  function widthPx(width: BlockStackBlock['width']) {
    return typeof width === 'number' ? `${width}px` : undefined;
  }
</script>

{#if variant === 'notch'}
  <div
    role="img"
    aria-label={ariaLabel}
    class={cn('ui:flex ui:flex-col-reverse ui:items-start ui:gap-0.5', className)}
    data-variant="notch"
  >
    {#each blocks as block, index (block.id ?? `${block.kind}-${index}`)}
      {@const tone = block.tone ?? 'sand'}
      {@const filled = tone !== 'empty'}
      <div
        class={cn(
          'ui:relative ui:max-w-full ui:shrink-0',
          size === 'lg' ? 'ui:h-[72px]' : 'ui:h-16',
          widthClass(block.width, 'full')
        )}
        class:drop={filled && notchAnimation === 'drop'}
        class:settle={filled && notchAnimation === 'settle'}
        style:width={widthPx(block.width)}
        style:z-index={index + 1}
        style:animation-delay={filled && notchAnimation === 'drop'
          ? `${(index % DROP_STAGGER_GROUP) * DROP_STAGGER_MS}ms`
          : undefined}
        style:--notch-x="24px"
        data-block={block.kind}
        data-tone={tone}
      >
        <div
          class={cn(
            'ui:absolute ui:inset-0 ui:flex ui:flex-col ui:gap-0.5 ui:rounded-[10px] ui:px-[18px] ui:pt-3.5',
            filled && 'ui:notch-cutout',
            notchFaces[tone]
          )}
        >
          <span class={cn('ui:font-mono ui:text-[10px] ui:tracking-[0.12em] uppercase', notchKinds[tone])}>
            {block.kind}
          </span>
          <span class="ui:text-[15px] ui:font-semibold ui:tracking-[-0.01em] truncate">{block.label}</span>
        </div>
        {#if filled && index > 0}
          <span
            aria-hidden="true"
            class={cn(
              'ui:pointer-events-none ui:absolute ui:-bottom-3 ui:left-[23.4px] ui:h-3 ui:w-[47.2px]',
              notchTabs[tone]
            )}
            style:clip-path={TAB_PATH}
          ></span>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <div role="img" aria-label={ariaLabel} class={cn('ui:flex ui:flex-col ui:items-start ui:gap-2', className)}>
    {#each blocks as block, index (block.id ?? `${block.kind}-${index}`)}
      <div
        class={cn(
          'ui:flex ui:items-center ui:gap-2 ui:rounded-lg ui:border ui:px-3 ui:py-2.5 ui:shadow-sm',
          widthClass(block.width, 'lg'),
          listTones[block.tone ?? 'muted'],
          animate && 'ui:animate-in ui:fade-in ui:slide-in-from-bottom-4 ui:duration-500 ui:motion-reduce:animate-none'
        )}
        style:width={widthPx(block.width)}
        style:animation-delay={animate ? `${index * 120}ms` : undefined}
        style:animation-fill-mode={animate ? 'both' : undefined}
        data-block={block.kind}
      >
        <span class="ui:text-[10px] ui:font-semibold ui:tracking-[0.14em] ui:opacity-70 uppercase">{block.kind}</span>
        <span class="ui:text-sm ui:font-medium truncate">{block.label}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .drop {
    animation: block-drop-once 760ms linear both;
  }

  .settle {
    animation: block-settle 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes block-drop-once {
    0% {
      transform: translateY(-90px);
      opacity: 0;
      animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.45);
    }
    70% {
      transform: none;
      opacity: 1;
      animation-timing-function: ease-out;
    }
    85% {
      transform: translateY(-5px);
    }
    100% {
      transform: none;
      opacity: 1;
    }
  }

  @keyframes block-settle {
    0% {
      opacity: 0;
      transform: scale(0.96);
    }
    100% {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .drop,
    .settle {
      animation: none;
    }
  }
</style>
