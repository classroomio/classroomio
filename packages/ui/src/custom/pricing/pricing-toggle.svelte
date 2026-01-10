<script lang="ts">
  import { Button } from '../../base/button';
  import { Badge } from '../../base/badge';
  import { PremiumIcon, HoverableItem } from '../moving-icons';

  let {
    isYearlyPlan = $bindable(true),
    monthlyLabel = 'Monthly',
    annuallyLabel = 'Annually',
    saveLabel = 'Save 20%'
  } = $props();
</script>

<div class="white 0 relative mb-6 flex items-center rounded-full border p-1">
  <Button
    variant={isYearlyPlan ? 'ghost' : 'secondary'}
    size="sm"
    class="rounded-full! transition-all duration-500 ease-in-out "
    onclick={() => (isYearlyPlan = false)}
  >
    {monthlyLabel}
  </Button>
  <Button
    variant={isYearlyPlan ? 'secondary' : 'ghost'}
    size="sm"
    class="rounded-full! transition-all duration-500 ease-in-out"
    onclick={() => (isYearlyPlan = true)}
  >
    {annuallyLabel}
  </Button>
  <HoverableItem>
    {#snippet children(isHovered)}
      <Badge variant="default" class="absolute -top-3 right-[-20%] rotate-5 shadow-2xl">
        <PremiumIcon size={8} {isHovered} class="text-amber-500!" />
        {saveLabel}
      </Badge>
    {/snippet}
  </HoverableItem>
</div>
