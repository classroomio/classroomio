<script lang="ts">
  import { page } from '$app/state';
  import { t } from '$lib/utils/functions/translations';
  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import { TOKEN_PACK } from '@cio/utils/plans';
  import { snackbar } from '$features/ui/snackbar/store';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';

  interface Props {
    onBeforeRedirect?: () => void;
  }

  let { onBeforeRedirect }: Props = $props();

  let quantity = $state(1);
  let isRedirecting = $state(false);

  const tokens = $derived(quantity * TOKEN_PACK.TOKENS_PER_UNIT);
  const dollars = $derived((quantity * TOKEN_PACK.PRICE_USD_CENTS) / 100);

  function bump(delta: number) {
    quantity = Math.min(100, Math.max(1, quantity + delta));
  }

  function buy() {
    if (!$profile.id || !$profile.email || !$currentOrg.id || !$currentOrg.siteName) {
      snackbar.error('snackbar.ai_credits.checkout_failed');

      return;
    }

    isRedirecting = true;

    const checkoutURL = new URL('/api/polar/buy-tokens', page.url);
    checkoutURL.searchParams.set('quantity', String(quantity));
    checkoutURL.searchParams.set('customerEmail', $profile.email?.replace('@test.com', '+test@digdippa.com') ?? '');

    if ($profile.fullname) {
      checkoutURL.searchParams.set('customerName', $profile.fullname);
    }

    checkoutURL.searchParams.set(
      'metadata',
      JSON.stringify({
        orgId: $currentOrg.id,
        orgSlug: $currentOrg.siteName,
        triggeredBy: $profile.id
      })
    );

    onBeforeRedirect?.();
    window.location.href = checkoutURL.toString();
  }
</script>

<Card.Root id="buy-tokens">
  <Card.Header>
    <Card.Title>{$t('settings.ai_credits.buy_tokens.title')}</Card.Title>
    <Card.Description>
      {$t('settings.ai_credits.buy_tokens.description')}
    </Card.Description>
  </Card.Header>
  <Card.Content class="flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <Button variant="outline" size="icon" onclick={() => bump(-1)} disabled={quantity <= 1}>
        <MinusIcon class="size-4" />
      </Button>
      <span class="ui:text-muted-foreground min-w-[3rem] text-center text-sm font-medium tabular-nums">
        {quantity}
      </span>
      <Button variant="outline" size="icon" onclick={() => bump(1)} disabled={quantity >= 100}>
        <PlusIcon class="size-4" />
      </Button>
      <span class="ui:text-muted-foreground ml-2 text-xs">
        {$t('settings.ai_credits.buy_tokens.quantity_hint')}
      </span>
    </div>

    <p class="ui:text-muted-foreground text-sm">
      {$t('settings.ai_credits.buy_tokens.preview', {
        quantity: String(quantity),
        tokens: tokens.toLocaleString(),
        dollars: dollars.toFixed(2)
      })}
    </p>

    <Button onclick={buy} loading={isRedirecting} class="w-fit">
      {$t('settings.ai_credits.buy_tokens.buy_button', { dollars: dollars.toFixed(2) })}
    </Button>
  </Card.Content>
</Card.Root>
