<script lang="ts">
  import { Badge } from '../../base/badge';
  import { HoverableItem, PremiumIcon } from '../moving-icons';

  interface Props {
    isYearly?: boolean;
    monthlyLabel?: string;
    yearlyLabel?: string;
    saveLabel?: string;
    onToggle?: (isYearly: boolean) => void;
  }

  let {
    isYearly = $bindable(false),
    monthlyLabel = 'Monthly',
    yearlyLabel = 'Annually',
    saveLabel = 'Save 2 months',
    onToggle
  }: Props = $props();

  function handleToggle(value: boolean) {
    isYearly = value;
    onToggle?.(value);
  }
</script>

{#snippet period_button(isActive: boolean, isMonth: boolean)}
  <button
    type="button"
    class="ui:cursor-pointer ui:rounded-full ui:px-3 ui:py-1 ui:text-sm ui:font-medium ui:transition-all ui:duration-500 ui:ease-in-out {isActive
      ? 'ui:bg-gray-200 ui:text-secondary-foreground'
      : 'ui:text-muted-foreground ui:hover:text-accent-foreground'}"
    onclick={() => handleToggle(isMonth ? false : true)}
  >
    {isMonth ? monthlyLabel : yearlyLabel}
  </button>
{/snippet}

<div
  class="ui:relative ui:z-10 ui:flex ui:items-center ui:rounded-full ui:border ui:p-1 ui:bg-white ui:dark:bg-slate-950 ui:dark:border-slate-800"
>
  {@render period_button(!isYearly, true)}

  {@render period_button(isYearly, false)}

  {#if saveLabel}
    <HoverableItem>
      {#snippet children(isHovered)}
        <Badge
          variant="default"
          class="ui:absolute ui:-top-3 ui:-right-4 ui:rotate-5 ui:shadow-2xl ui:bg-linear-to-r ui:from-pink-500 ui:to-orange-500 ui:px-2 ui:py-0.5"
        >
          <PremiumIcon size={8} {isHovered} class="ui:text-white! ui:mr-1" />
          <span class="ui:text-[10px] ui:font-bold ui:text-white">{saveLabel}</span>
        </Badge>
      {/snippet}
    </HoverableItem>
  {/if}
</div>
