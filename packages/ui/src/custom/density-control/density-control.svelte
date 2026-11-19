<script lang="ts">
  import { cn } from '../../tools';
  import type { DensityControlOption, DensityControlValue } from './types';

  interface Props {
    value: DensityControlValue;
    options: DensityControlOption[];
    onChange?: (value: DensityControlValue) => void;
    groupLabel?: string;
    class?: string;
    /** Prefix for per-option hooks (`${testIdPrefix}-compact`, …). */
    testIdPrefix?: string;
  }

  let {
    value,
    options,
    onChange,
    groupLabel = 'Reading density',
    class: className = '',
    testIdPrefix
  }: Props = $props();

  const gaps: Record<DensityControlValue, string> = {
    compact: '4px',
    comfortable: '7px',
    spacious: '11px'
  };
</script>

<div class={cn('ui:flex ui:flex-wrap ui:items-center ui:gap-3.5', className)}>
  <div class="ui:bg-muted ui:inline-flex ui:gap-0.5 ui:rounded-lg ui:p-[3px]" role="group" aria-label={groupLabel}>
    {#each options as option (option.value)}
      {@const active = value === option.value}
      <button
        type="button"
        class={cn(
          'ui:inline-flex ui:cursor-pointer ui:items-center ui:rounded-md ui:px-3 ui:py-[5px] ui:text-[13px] ui:font-medium ui:transition ui:focus-visible:ring-2 ui:focus-visible:ring-ring ui:focus-visible:outline-none',
          active
            ? 'ui:bg-background ui:text-foreground ui:shadow-2xs'
            : 'ui:bg-transparent ui:text-muted-foreground ui:hover:bg-background/60 ui:hover:text-foreground'
        )}
        aria-pressed={active}
        data-testid={testIdPrefix ? `${testIdPrefix}-${option.value}` : undefined}
        onclick={() => onChange?.(option.value)}
      >
        {option.label}
      </button>
    {/each}
  </div>
  <div
    class="ui:bg-muted ui:flex ui:w-[34px] ui:flex-col ui:rounded-md ui:px-[5px] ui:py-1.5 ui:transition-[gap] ui:duration-200"
    style="gap: {gaps[value]}"
    aria-hidden="true"
  >
    <span class="ui:bg-muted-foreground/55 ui:block ui:h-1 ui:w-full ui:rounded-full"></span>
    <span class="ui:bg-muted-foreground/55 ui:block ui:h-1 ui:w-full ui:rounded-full"></span>
    <span class="ui:bg-muted-foreground/55 ui:block ui:h-1 ui:w-full ui:rounded-full"></span>
  </div>
</div>
