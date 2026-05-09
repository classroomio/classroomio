<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { SvelteDate } from 'svelte/reactivity';
  import type { AiUsageData, PurchasedSummaryData } from '$features/settings/utils/types';

  interface Props {
    usage: AiUsageData | null;
    purchased: PurchasedSummaryData | null;
  }

  let { usage, purchased }: Props = $props();

  const includedPercent = $derived(
    usage && usage.allowance > 0 ? Math.min(100, Math.round((usage.used / usage.allowance) * 100)) : 0
  );

  const resetDate = $derived.by(() => {
    const nextReset = new SvelteDate();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1);

    return nextReset.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  });

  const dollarsSpent = $derived(purchased ? (purchased.totalSpentCents / 100).toFixed(2) : '0.00');
</script>

<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
  <Card.Root>
    <Card.Header>
      <Card.Description>{$t('settings.ai_credits.included.title')}</Card.Description>
      <Card.Title class="text-2xl">
        {#if usage}
          {usage.used.toLocaleString()} / {usage.allowance.toLocaleString()}
        {:else}
          —
        {/if}
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p class="ui:text-muted-foreground mb-3 text-xs">
        {$t('settings.ai_credits.included.subtitle')}
      </p>
      <div class="ui:bg-muted h-2 w-full rounded-full">
        <div
          class="h-2 rounded-full transition-all {includedPercent > 90
            ? 'bg-red-500'
            : includedPercent > 70
              ? 'bg-amber-500'
              : 'ui:bg-primary'}"
          style="width: {includedPercent}%"
        ></div>
      </div>
      <p class="ui:text-muted-foreground mt-2 text-xs">
        {$t('settings.ai_credits.included.resets_on', { date: resetDate })}
      </p>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header>
      <Card.Description>{$t('settings.ai_credits.purchased.title')}</Card.Description>
      <Card.Title class="text-2xl">
        {#if purchased}
          {purchased.currentBalance.toLocaleString()}
        {:else}
          —
        {/if}
      </Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-3">
      <p class="ui:text-muted-foreground text-xs">
        {$t('settings.ai_credits.purchased.subtitle')}
      </p>
      <p class="ui:text-muted-foreground text-xs">
        {$t('settings.ai_credits.purchased.lifetime', {
          tokens: purchased ? purchased.totalPurchasedTokens.toLocaleString() : '0',
          dollars: dollarsSpent
        })}
      </p>
      <Button variant="outline" size="sm" class="w-fit" href="#buy-tokens">
        {$t('settings.ai_credits.purchased.buy_more')}
      </Button>
    </Card.Content>
  </Card.Root>
</div>
