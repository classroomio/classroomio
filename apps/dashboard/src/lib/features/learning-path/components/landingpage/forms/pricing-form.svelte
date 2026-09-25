<script lang="ts">
  import type { TLandingPage } from '@cio/utils/validation/learning-path';
  import type { LearningPathDetail } from '$features/learning-path/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { PricingFormView } from '$features/ui';

  interface Props {
    landingPage: TLandingPage;
    path: LearningPathDetail;
    cost?: number;
    currency?: 'USD' | 'NGN';
    showPaymentError?: boolean;
    onChange: (patch: Partial<TLandingPage>) => void;
  }

  let {
    landingPage,
    path,
    cost = $bindable(Number(path.cost) || 0),
    currency = $bindable<'USD' | 'NGN'>((path.currency as string) === 'NGN' ? 'NGN' : 'USD'),
    showPaymentError = false,
    onChange
  }: Props = $props();

  let isPaid = $derived(Boolean(landingPage.paymentEnabled));
  let paymentLink = $derived(landingPage.paymentLink ?? '');
  let showDiscount = $derived(Boolean(landingPage.showDiscount));
  let discount = $derived(landingPage.discount ?? 0);
  let giftToggled = $derived(Boolean(landingPage.reward?.show));
  let rewardDescription = $derived(landingPage.reward?.description ?? '');
</script>

<PricingFormView
  {isPaid}
  {currency}
  {cost}
  {paymentLink}
  {showDiscount}
  {discount}
  {giftToggled}
  {rewardDescription}
  {showPaymentError}
  paymentRequiredError={$t('learningPath.landing.pricing.payment_required')}
  paymentInvalidUrlError={$t('learningPath.landing.pricing.payment_invalid_url')}
  paymentHelperMessage={$t('learningPath.landing.pricing.payment_helper')}
  percentageHelperMessage={$t('learningPath.landing.pricing.percentage_helper')}
  onPaidChange={(checked) => onChange({ paymentEnabled: checked })}
  onCurrencyChange={(curr) => {
    currency = curr === 'NGN' ? 'NGN' : 'USD';
  }}
  onCostChange={(val) => {
    cost = val;
  }}
  onPaymentLinkChange={(val) => onChange({ paymentLink: val })}
  onShowDiscountChange={(checked) => onChange({ showDiscount: checked })}
  onDiscountChange={(val) => onChange({ discount: val })}
  onGiftToggleChange={(checked) =>
    onChange({
      reward: {
        show: checked,
        description: landingPage.reward?.description ?? ''
      }
    })}
  onRewardDescriptionChange={(content) =>
    onChange({
      reward: {
        show: landingPage.reward?.show ?? true,
        description: content
      }
    })}
/>
