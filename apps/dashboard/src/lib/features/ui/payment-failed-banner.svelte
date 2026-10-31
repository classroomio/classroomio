<script lang="ts">
  import { resolve } from '$app/paths';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isOrgPaymentBlocked, isOrgPaymentPastDue, orgPaymentBlockDate } from '$lib/utils/store/org';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  const blockDateLabel = $derived($orgPaymentBlockDate?.toLocaleDateString(undefined, { dateStyle: 'long' }) ?? '');
  const billingHref = $derived(resolve('/org/[slug]/settings/billing', { slug: $currentOrg.siteName ?? '' }));
</script>

{#if $isOrgPaymentPastDue}
  <div
    class="ui:z-app-bar-elevated fixed inset-x-0 top-0 flex h-9 items-center justify-center gap-2 border-b border-yellow-300 bg-yellow-100 px-4 text-xs text-yellow-950 sm:text-sm dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100"
    role="alert"
    data-testid="payment-failed-banner"
  >
    <TriangleAlertIcon class="size-4 shrink-0" />
    <span class="truncate">
      {$isOrgPaymentBlocked
        ? $t('settings.billing.payment_failed.blocked')
        : $t('settings.billing.payment_failed.warning', { date: blockDateLabel })}
    </span>
    <a
      href={billingHref}
      class="shrink-0 font-semibold underline underline-offset-2"
      data-testid="payment-failed-banner-action"
    >
      {$t('settings.billing.payment_failed.action')}
    </a>
  </div>
{/if}
