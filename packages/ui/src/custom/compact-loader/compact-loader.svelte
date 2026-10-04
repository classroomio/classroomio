<script module lang="ts">
  const SLOT_CLASSES = [
    'ui:bg-muted',
    'ui:bg-[color-mix(in_srgb,var(--primary)_35%,var(--background))]',
    'ui:bg-primary'
  ];
</script>

<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    size?: 'sm' | 'md';
    label?: string;
    class?: string;
  }

  let { size = 'md', label, class: className }: Props = $props();
</script>

<div
  role="status"
  aria-label={label}
  class={cn('ui:pointer-events-none ui:inline-flex ui:flex-col-reverse ui:items-center ui:gap-0.5', className)}
  class:small={size === 'sm'}
>
  {#each SLOT_CLASSES as tone, index (index)}
    <div class="slot" style:--index={index} style:z-index={index + 1}>
      <span
        aria-hidden="true"
        class="ui:notch-cutout ui:block ui:h-[26px] ui:w-[84px] ui:rounded-md ui:[--notch-h:6px] ui:[--notch-w:22px] ui:[--notch-x:14px] {tone}"
      ></span>
      {#if index > 0}
        <span aria-hidden="true" class="tab {tone}"></span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .small {
    zoom: 0.6;
  }

  .slot {
    position: relative;
    animation: drop 2.4s linear infinite both;
    animation-delay: calc(var(--index) * 0.432s);
  }

  .tab {
    position: absolute;
    bottom: -7px;
    left: 16px;
    width: 18px;
    height: 7px;
    clip-path: path('M0 0 H18 Q15.8 0 15.3 1.4 L14.2 5.2 Q13.8 7 12 7 H6 Q4.2 7 3.8 5.2 L2.7 1.4 Q2.2 0 0 0 Z');
  }

  @keyframes drop {
    0%,
    4% {
      transform: translateY(-46px);
      opacity: 0;
      animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.45);
    }
    16% {
      transform: none;
      opacity: 1;
      animation-timing-function: ease-out;
    }
    20% {
      transform: translateY(-3px);
    }
    24%,
    80% {
      transform: none;
      opacity: 1;
    }
    92%,
    100% {
      transform: translateY(-6px);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slot {
      animation: none;
    }
  }
</style>
