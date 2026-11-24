<script lang="ts">
  import { cn } from '../../tools';

  interface Props {
    current: number;
    total: number;
    stepText: string;
    label: string;
    ariaLabel: string;
    hideLabelOnMobile?: boolean;
    class?: string;
  }

  let { current, total, stepText, label, ariaLabel, hideLabelOnMobile = false, class: className }: Props = $props();

  const segments = $derived(Array.from({ length: total }, (_, index) => index));
</script>

<div class={cn('ui:flex ui:w-full ui:flex-col ui:gap-3', className)}>
  <div
    class="ui:flex ui:items-center ui:justify-between ui:gap-4 ui:text-[11px] ui:font-semibold ui:tracking-[0.14em] uppercase"
  >
    <span class="ui:text-muted-foreground">{stepText}</span>
    <span class={cn('ui:text-primary truncate', hideLabelOnMobile && 'ui:max-md:hidden')}>{label}</span>
  </div>

  <div
    role="progressbar"
    aria-valuemin={1}
    aria-valuemax={total}
    aria-valuenow={current}
    aria-valuetext={stepText}
    aria-label={ariaLabel}
    class="ui:flex ui:gap-1.5"
  >
    {#each segments as segment (segment)}
      <span
        class={cn(
          'ui:h-1 ui:flex-1 ui:rounded-full ui:transition-[background-color] ui:motion-reduce:transition-none',
          segment < current ? 'ui:bg-primary' : 'ui:bg-muted'
        )}
      ></span>
    {/each}
  </div>
</div>
