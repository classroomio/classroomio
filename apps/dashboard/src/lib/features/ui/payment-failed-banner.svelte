<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPlan, isOrgPaymentBlocked, orgPaymentBlockDate } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import * as Item from '@cio/ui/base/item';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  const isVisible = $derived($currentOrgPlan?.provider === 'polar' && $orgPaymentBlockDate !== null);
  const blockDateLabel = $derived($orgPaymentBlockDate?.toLocaleDateString(undefined, { dateStyle: 'long' }) ?? '');

  function openBillingPortal() {
    const url = new URL('/api/polar/portal', window.location.origin);
    url.searchParams.set('orgId', $currentOrg.id);

    window.open(url.toString(), '_blank');
  }
</script>

{#if isVisible}
  <Item.Root variant="outline" size="sm" class="border-red-600! py-2!">
    <Item.Media variant="icon">
      <TriangleAlertIcon class="size-5 text-red-600" />
    </Item.Media>
    <Item.Content>
      <Item.Title class="text-red-700! dark:text-red-400!">
        {$isOrgPaymentBlocked
          ? $t('settings.billing.payment_failed.blocked')
          : $t('settings.billing.payment_failed.warning', { date: blockDateLabel })}
      </Item.Title>
    </Item.Content>
    <Item.Actions>
      <Button size="sm" onclick={openBillingPortal} testId="payment-failed-banner-action">
        {$t('settings.billing.payment_failed.action')}
      </Button>
    </Item.Actions>
  </Item.Root>
{/if}
