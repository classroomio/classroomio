<script lang="ts">
  import { Spinner } from '@cio/ui/base/spinner';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import * as Field from '@cio/ui/base/field';
  import * as Item from '@cio/ui/base/item';

  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, isFreePlan } from '$lib/utils/store/org';
  import { paymentApi, type PayoutAccount } from '$features/payment/api';
  import { snackbar } from '$features/ui/snackbar/store';
  import { UpgradeBanner } from '$features/ui';

  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import BanknoteIcon from '@lucide/svelte/icons/banknote';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import PlusIcon from '@lucide/svelte/icons/plus';

  // Form state for creating new payout account
  let showStripeForm = $state(false);
  let showPaystackForm = $state(false);

  // Stripe form fields
  let stripeAccountName = $state('');
  let stripeAccountEmail = $state('');

  // Paystack form fields
  let paystackAccountName = $state('');
  let paystackAccountEmail = $state('');
  let paystackBusinessName = $state('');
  let paystackBankCode = $state('');
  let paystackAccountNumber = $state('');

  // Computed: check if accounts exist
  const hasStripeAccount = $derived(paymentApi.payoutAccounts.some((a) => a.provider === 'stripe'));
  const hasPaystackAccount = $derived(paymentApi.payoutAccounts.some((a) => a.provider === 'paystack'));
  const stripeAccount = $derived(paymentApi.payoutAccounts.find((a) => a.provider === 'stripe'));
  const paystackAccount = $derived(paymentApi.payoutAccounts.find((a) => a.provider === 'paystack'));

  // Format currency
  function formatCurrency(amount: number, currency: string) {
    const mainAmount = amount / 100;
    const locale = currency === 'NGN' ? 'en-NG' : 'en-US';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(mainAmount);
  }

  // Load data on mount
  $effect(() => {
    if (!$currentOrg?.id) return;

    paymentApi.getPayoutAccounts($currentOrg.id);
    paymentApi.getEarnings($currentOrg.id);
    paymentApi.getTransactions($currentOrg.id);
  });

  // Load Paystack banks when form is shown
  $effect(() => {
    if (showPaystackForm && paymentApi.paystackBanks.length === 0) {
      paymentApi.getPaystackBanks();
    }
  });

  // Verify Paystack account when account number and bank are selected
  async function verifyPaystackAccount() {
    if (paystackAccountNumber.length >= 10 && paystackBankCode) {
      await paymentApi.verifyPaystackAccount(paystackAccountNumber, paystackBankCode);
    }
  }

  // Create Stripe account
  async function createStripeAccount() {
    if (!$currentOrg?.id) return;

    // First create the payout account record
    const account = await paymentApi.createPayoutAccount({
      organizationId: $currentOrg.id,
      provider: 'stripe',
      currency: 'USD',
      accountName: stripeAccountName,
      accountEmail: stripeAccountEmail
    });

    if (account) {
      // Get Stripe Connect onboarding link
      const returnUrl = `${window.location.origin}/org/${$currentOrg.siteName}/settings/payout?stripe_return=true`;
      const refreshUrl = `${window.location.origin}/org/${$currentOrg.siteName}/settings/payout?stripe_refresh=true`;

      const url = await paymentApi.getStripeAccountLink($currentOrg.id, returnUrl, refreshUrl);

      if (url) {
        window.location.href = url;
      }
    }

    showStripeForm = false;
    resetStripeForm();
  }

  // Create Paystack subaccount
  async function createPaystackAccount() {
    if (!$currentOrg?.id) return;

    await paymentApi.createPayoutAccount({
      organizationId: $currentOrg.id,
      provider: 'paystack',
      currency: 'NGN',
      accountName: paystackAccountName || paymentApi.verifiedAccountName || '',
      accountEmail: paystackAccountEmail,
      paystackBankCode,
      paystackAccountNumber,
      paystackBusinessName,
      paystackPercentageCharge: 0
    });

    showPaystackForm = false;
    resetPaystackForm();
  }

  // Continue Stripe onboarding
  async function continueStripeOnboarding() {
    if (!$currentOrg?.id) return;

    const returnUrl = `${window.location.origin}/org/${$currentOrg.siteName}/settings/payout?stripe_return=true`;
    const refreshUrl = `${window.location.origin}/org/${$currentOrg.siteName}/settings/payout?stripe_refresh=true`;

    const url = await paymentApi.getStripeAccountLink($currentOrg.id, returnUrl, refreshUrl);

    if (url) {
      window.location.href = url;
    }
  }

  // Reset form fields
  function resetStripeForm() {
    stripeAccountName = '';
    stripeAccountEmail = '';
  }

  function resetPaystackForm() {
    paystackAccountName = '';
    paystackAccountEmail = '';
    paystackBusinessName = '';
    paystackBankCode = '';
    paystackAccountNumber = '';
    paymentApi.verifiedAccountName = null;
  }

  // Get status badge variant
  function getStatusBadge(account: PayoutAccount) {
    if (account.isActive) {
      return { variant: 'default' as const, label: 'Active', icon: CheckCircleIcon };
    }
    return { variant: 'secondary' as const, label: 'Setup Incomplete', icon: AlertCircleIcon };
  }
</script>

<UpgradeBanner>Upgrade to accept payments for your courses</UpgradeBanner>

<div class="flex w-full max-w-2xl! flex-col gap-6 px-2">
  <!-- Earnings Summary -->
  <Field.Set>
    <Field.Legend>Earnings Summary</Field.Legend>
    <Field.Description class="mb-4">Overview of your course sales</Field.Description>

    {#if paymentApi.isFetchingEarnings}
      <div class="flex justify-center py-4">
        <Spinner class="size-8! text-blue-700!" />
      </div>
    {:else if paymentApi.earnings}
      <div class="grid gap-4 sm:grid-cols-2">
        <!-- USD Earnings -->
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <CreditCardIcon class="size-4" />
            <span>USD Earnings (Stripe)</span>
          </div>
          <div class="mt-2">
            <p class="text-2xl font-bold">{formatCurrency(paymentApi.earnings.USD.totalNetEarnings, 'USD')}</p>
            <p class="text-sm text-gray-500">
              {paymentApi.earnings.USD.transactionCount} transactions
            </p>
          </div>
        </div>

        <!-- NGN Earnings -->
        <div class="rounded-lg border p-4">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <BanknoteIcon class="size-4" />
            <span>NGN Earnings (Paystack)</span>
          </div>
          <div class="mt-2">
            <p class="text-2xl font-bold">{formatCurrency(paymentApi.earnings.NGN.totalNetEarnings, 'NGN')}</p>
            <p class="text-sm text-gray-500">
              {paymentApi.earnings.NGN.transactionCount} transactions
            </p>
          </div>
        </div>
      </div>
    {:else}
      <p class="text-gray-500">No earnings data available</p>
    {/if}
  </Field.Set>

  <Field.Separator />

  <!-- Payout Accounts -->
  <Field.Set>
    <Field.Legend>Payout Accounts</Field.Legend>
    <Field.Description class="mb-4">Connect your bank accounts to receive payments</Field.Description>

    {#if paymentApi.isFetchingPayoutAccounts}
      <div class="flex justify-center py-4">
        <Spinner class="size-8! text-blue-700!" />
      </div>
    {:else}
      <div class="space-y-4">
        <!-- Stripe Account (USD) -->
        {#if stripeAccount}
          {@const status = getStatusBadge(stripeAccount)}
          <Item.Root variant="outline">
            <Item.Media variant="icon">
              <CreditCardIcon />
            </Item.Media>
            <Item.Content>
              <Item.Title>Stripe (USD)</Item.Title>
              <Item.Description>
                {stripeAccount.accountEmail}
              </Item.Description>
            </Item.Content>
            <Item.Actions class="flex items-center gap-2">
              <Badge variant={status.variant}>
                <svelte:component this={status.icon} class="mr-1 size-3" />
                {status.label}
              </Badge>
              {#if !stripeAccount.isActive}
                <Button size="sm" variant="outline" onclick={continueStripeOnboarding}>
                  <ExternalLinkIcon class="mr-1 size-4" />
                  Complete Setup
                </Button>
              {/if}
            </Item.Actions>
          </Item.Root>
        {:else if !showStripeForm}
          <Item.Root variant="outline" class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onclick={() => (showStripeForm = true)}>
            <Item.Media variant="icon">
              <PlusIcon />
            </Item.Media>
            <Item.Content>
              <Item.Title>Connect Stripe (USD)</Item.Title>
              <Item.Description>Accept payments in US Dollars</Item.Description>
            </Item.Content>
          </Item.Root>
        {/if}

        <!-- Stripe Form -->
        {#if showStripeForm && !hasStripeAccount}
          <div class="rounded-lg border p-4">
            <h4 class="mb-4 font-medium">Connect Stripe Account</h4>
            <Field.Group>
              <Field.Field>
                <Field.Label>Account Name</Field.Label>
                <Input bind:value={stripeAccountName} placeholder="Your name or business name" disabled={$isFreePlan} />
              </Field.Field>
              <Field.Field>
                <Field.Label>Email</Field.Label>
                <Input type="email" bind:value={stripeAccountEmail} placeholder="email@example.com" disabled={$isFreePlan} />
              </Field.Field>
              <div class="flex gap-2">
                <Button onclick={createStripeAccount} loading={paymentApi.isCreatingAccount} disabled={$isFreePlan || !stripeAccountName || !stripeAccountEmail}>
                  Continue to Stripe
                </Button>
                <Button variant="ghost" onclick={() => { showStripeForm = false; resetStripeForm(); }}>Cancel</Button>
              </div>
            </Field.Group>
          </div>
        {/if}

        <!-- Paystack Account (NGN) -->
        {#if paystackAccount}
          {@const status = getStatusBadge(paystackAccount)}
          <Item.Root variant="outline">
            <Item.Media variant="icon">
              <BanknoteIcon />
            </Item.Media>
            <Item.Content>
              <Item.Title>Paystack (NGN)</Item.Title>
              <Item.Description>
                {paystackAccount.providerData?.bankName || 'Bank'} - ****{paystackAccount.providerData?.accountNumber?.slice(-4) || ''}
              </Item.Description>
            </Item.Content>
            <Item.Actions>
              <Badge variant={status.variant}>
                <svelte:component this={status.icon} class="mr-1 size-3" />
                {status.label}
              </Badge>
            </Item.Actions>
          </Item.Root>
        {:else if !showPaystackForm}
          <Item.Root variant="outline" class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" onclick={() => (showPaystackForm = true)}>
            <Item.Media variant="icon">
              <PlusIcon />
            </Item.Media>
            <Item.Content>
              <Item.Title>Connect Paystack (NGN)</Item.Title>
              <Item.Description>Accept payments in Nigerian Naira</Item.Description>
            </Item.Content>
          </Item.Root>
        {/if}

        <!-- Paystack Form -->
        {#if showPaystackForm && !hasPaystackAccount}
          <div class="rounded-lg border p-4">
            <h4 class="mb-4 font-medium">Connect Paystack Account</h4>
            <Field.Group>
              <Field.Field>
                <Field.Label>Business Name</Field.Label>
                <Input bind:value={paystackBusinessName} placeholder="Your business name" disabled={$isFreePlan} />
              </Field.Field>
              <Field.Field>
                <Field.Label>Email</Field.Label>
                <Input type="email" bind:value={paystackAccountEmail} placeholder="email@example.com" disabled={$isFreePlan} />
              </Field.Field>
              <Field.Field>
                <Field.Label>Bank</Field.Label>
                <Select.Root type="single" bind:value={paystackBankCode} disabled={$isFreePlan || paymentApi.isFetchingBanks}>
                  <Select.Trigger class="w-full">
                    <p>{paystackBankCode ? paymentApi.paystackBanks.find((b) => b.code === paystackBankCode)?.name : 'Select a bank'}</p>
                  </Select.Trigger>
                  <Select.Content class="max-h-60 overflow-y-auto">
                    {#each paymentApi.paystackBanks as bank}
                      <Select.Item value={bank.code}>{bank.name}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </Field.Field>
              <Field.Field>
                <Field.Label>Account Number</Field.Label>
                <Input
                  bind:value={paystackAccountNumber}
                  placeholder="0123456789"
                  maxlength={10}
                  disabled={$isFreePlan}
                  onblur={verifyPaystackAccount}
                />
                {#if paymentApi.isVerifyingAccount}
                  <Field.Description>Verifying account...</Field.Description>
                {:else if paymentApi.verifiedAccountName}
                  <Field.Description class="text-green-600">
                    <CheckCircleIcon class="mr-1 inline size-4" />
                    {paymentApi.verifiedAccountName}
                  </Field.Description>
                {/if}
              </Field.Field>
              <div class="flex gap-2">
                <Button
                  onclick={createPaystackAccount}
                  loading={paymentApi.isCreatingAccount}
                  disabled={$isFreePlan || !paystackBusinessName || !paystackAccountEmail || !paystackBankCode || !paystackAccountNumber || paystackAccountNumber.length < 10}
                >
                  Create Account
                </Button>
                <Button variant="ghost" onclick={() => { showPaystackForm = false; resetPaystackForm(); }}>Cancel</Button>
              </div>
            </Field.Group>
          </div>
        {/if}
      </div>
    {/if}
  </Field.Set>

  <Field.Separator />

  <!-- Recent Transactions -->
  <Field.Set>
    <Field.Legend>Recent Transactions</Field.Legend>
    <Field.Description class="mb-4">Your recent course sales</Field.Description>

    {#if paymentApi.isFetchingTransactions}
      <div class="flex justify-center py-4">
        <Spinner class="size-8! text-blue-700!" />
      </div>
    {:else if paymentApi.transactions.length > 0}
      <div class="space-y-2">
        {#each paymentApi.transactions.slice(0, 10) as transaction}
          <Item.Root variant="outline">
            <Item.Content>
              <Item.Title class="text-sm">{transaction.studentName || transaction.studentEmail}</Item.Title>
              <Item.Description class="text-xs">
                {new Date(transaction.createdAt || '').toLocaleDateString()}
              </Item.Description>
            </Item.Content>
            <Item.Actions class="flex items-center gap-2">
              <span class="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</span>
              <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                {transaction.status}
              </Badge>
            </Item.Actions>
          </Item.Root>
        {/each}
      </div>
      {#if paymentApi.transactionsPagination && paymentApi.transactionsPagination.total > 10}
        <p class="mt-4 text-center text-sm text-gray-500">
          Showing 10 of {paymentApi.transactionsPagination.total} transactions
        </p>
      {/if}
    {:else}
      <p class="text-gray-500">No transactions yet</p>
    {/if}
  </Field.Set>
</div>
