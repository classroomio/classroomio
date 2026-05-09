<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrgPlan, isFreePlan, currentOrg } from '$lib/utils/store/org';
  import HourglassIcon from '@lucide/svelte/icons/hourglass';
  import { openUpgradeModal } from '$lib/utils/functions/org';
  import ReceiptIcon from '@lucide/svelte/icons/receipt';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import { ExternalLinkIcon, HoverableItem } from '@cio/ui/custom/moving-icons';

  let isRedirecting = $state(false);

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
</div>
