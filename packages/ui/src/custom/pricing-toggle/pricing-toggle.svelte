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

  // function handleToggle(value: boolean) {
  //   isYearly = value;
  //   onToggle?.(value);
  // }
  function handleToggle(value: boolean) {
    console.log('Toggle clicked, setting to:', value);
    isYearly = value;
    console.log('isYearly is now:', isYearly);
    onToggle?.(value);
  }
</script>

<div
  class="ui:relative ui:z-10 ui:flex ui:items-center ui:rounded-full ui:border ui:p-1 ui:bg-white ui:dark:bg-slate-950 ui:dark:border-slate-800"
>
  <button
    type="button"
    class="ui:rounded-full ui:px-4 ui:py-2 ui:text-sm ui:font-medium ui:transition-all ui:duration-500 ui:ease-in-out {!isYearly
      ? 'ui:bg-secondary ui:text-secondary-foreground'
      : 'ui:text-muted-foreground ui:hover:bg-accent ui:hover:text-accent-foreground'}"
    onclick={() => handleToggle(false)}
  >
    {monthlyLabel}
  </button>
  <button
    type="button"
    class="ui:rounded-full ui:px-4 ui:py-2 ui:text-sm ui:font-medium ui:transition-all ui:duration-500 ui:ease-in-out {isYearly
      ? 'ui:bg-secondary ui:text-secondary-foreground'
      : 'ui:text-muted-foreground ui:hover:bg-accent ui:hover:text-accent-foreground'}"
    onclick={() => handleToggle(true)}
  >
    {yearlyLabel}
  </button>

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
