<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrgPlan, isFreePlan, currentOrg } from '$lib/utils/store/org';
  import HourglassIcon from '@lucide/svelte/icons/hourglass';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import ReceiptIcon from '@lucide/svelte/icons/receipt';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import { ExternalLinkIcon, HoverableItem } from '@cio/ui/custom/moving-icons';

  const PUBLIC_API_URL = import.meta.env.VITE_API_URL || '';

  let isRedirecting = $state(false);

  interface AiUsageData {
    used: number;
    allowance: number;
    creditBalance: number;
    remaining: number;
  }

  let aiUsage: AiUsageData | null = $state(null);
  let aiUsageLoaded = $state(false);

  $effect(() => {
    if (!aiUsageLoaded && $currentOrg.id) {
      aiUsageLoaded = true;
      fetchAiUsage();
    }
  });

  async function fetchAiUsage() {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/agent/usage`, {
        headers: { 'Cio-org-id': $currentOrg.id || '' },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          aiUsage = result.data;
        }
      }
    } catch {
      // Silently fail
    }
  }

  async function onOpenBilling() {
    console.log({
      plan: $currentOrgPlan
    });

    try {
      if ($currentOrgPlan?.provider === 'polar') {
        const url = new URL('/api/polar/portal', window.location.origin);
        url.searchParams.set('customerId', $currentOrgPlan?.customerId || '');

        window.open(url.toString(), '_blank');
      }

      if ($currentOrgPlan?.provider === 'lmz') {
        isRedirecting = true;
        const url = new URL('/api/lmz/subscription', window.location.origin);
        url.searchParams.set('subscriptionId', $currentOrgPlan?.subscriptionId || '');

        const response = await fetch(url.toString());
        const result = await response.json();

        isRedirecting = false;

        window.open(result.customerPortal, '_blank');
      }
    } catch (error) {
      isRedirecting = false;

      console.error(error);
      snackbar.error($t('settings.billing.error'));
    }
  }
</script>

<div class="flex w-full max-w-lg! flex-col gap-4 px-2">
  <p class="text-md font-medium">{$t('settings.billing.manage')}</p>

  {#if $isFreePlan}
    <Item.Root variant="outline">
      <Item.Media variant="icon">
        <HourglassIcon />
      </Item.Media>
      <Item.Content>
        <Item.Description>{$t('settings.billing.active')}</Item.Description>
      </Item.Content>
      <Item.Actions>
        <Button size="sm" variant="outline" onclick={openUpgradeModal}>Upgrade</Button>
      </Item.Actions>
    </Item.Root>
  {:else}
    <Item.Root variant="outline">
      <Item.Media variant="icon">
        <ReceiptIcon />
      </Item.Media>
      <Item.Content>
        <Item.Description>{$t('settings.billing.provider')}</Item.Description>
      </Item.Content>
      <Item.Actions>
        <HoverableItem>
          {#snippet children(isHovered)}
            <Button size="sm" variant="outline" onclick={onOpenBilling} loading={isRedirecting}>
              <ExternalLinkIcon {isHovered} size={16} ariaHidden={true} />
              {$t('settings.billing.open_billing')}
            </Button>
          {/snippet}
        </HoverableItem>
      </Item.Actions>
    </Item.Root>
  {/if}

  {#if aiUsage}
    <div class="mt-6">
      <p class="text-md mb-3 font-medium">{$t('settings.billing.ai_credits')}</p>

      <Item.Root variant="outline">
        <Item.Media variant="icon">
          <SparklesIcon />
        </Item.Media>
        <Item.Content>
          <Item.Title>
            {aiUsage.used.toLocaleString()} / {aiUsage.allowance.toLocaleString()}
            {$t('settings.billing.ai_tokens_used')}
          </Item.Title>
          <Item.Description>
            {aiUsage.creditBalance.toLocaleString()}
            {$t('settings.billing.ai_bonus_credits')}
          </Item.Description>

          {@const usagePercent =
            aiUsage.allowance > 0 ? Math.min(100, Math.round((aiUsage.used / aiUsage.allowance) * 100)) : 0}
          <div class="ui:bg-muted mt-2 h-1.5 w-full rounded-full">
            <div
              class="h-1.5 rounded-full transition-all {usagePercent > 90
                ? 'bg-red-500'
                : usagePercent > 70
                  ? 'bg-amber-500'
                  : 'ui:bg-primary'}"
              style="width: {usagePercent}%"
            ></div>
          </div>
        </Item.Content>
      </Item.Root>
    </div>
  {/if}
</div>
