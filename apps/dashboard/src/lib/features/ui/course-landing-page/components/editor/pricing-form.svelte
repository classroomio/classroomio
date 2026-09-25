<script lang="ts">
  import type { Course } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { isCoursePaid } from '$lib/utils/functions/course';
  import { toFiniteNumber } from '@cio/utils/functions';
  import { PricingFormView } from '$features/ui';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
    showPaymentError?: boolean;
  }

  let { course = $bindable(), setter, showPaymentError = $bindable(false) }: Props = $props();

  let paymentLink = $derived((course?.metadata?.paymentLink as string | undefined) ?? '');
  let isPaid = $derived(isCoursePaid(course));
  let cost = $derived(toFiniteNumber(course?.cost) ?? 0);
  let currency = $derived(course?.currency === 'NGN' ? 'NGN' : 'USD');
  let showDiscount = $derived(Boolean(course?.metadata?.showDiscount ?? false));
  let discount = $derived(toFiniteNumber(course?.metadata?.discount as number | undefined) ?? 0);
  let giftToggled = $derived(Boolean(course?.metadata?.reward?.show ?? false));
  let rewardDescription = $derived((course?.metadata?.reward?.description as string | undefined) ?? '');
</script>

{#if typeof course !== 'undefined'}
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
    paymentRequiredError={$t('course.navItem.landing_page.editor.pricing_form.payment_required')}
    paymentInvalidUrlError={$t('course.navItem.landing_page.editor.pricing_form.payment_invalid_url')}
    paymentHelperMessage={$t('course.navItem.landing_page.editor.pricing_form.payment_helper')}
    percentageHelperMessage={$t('course.navItem.landing_page.editor.pricing_form.percentage_helper')}
    onPaidChange={(checked) => setter(checked, 'metadata.paymentEnabled')}
    onCurrencyChange={(curr) => setter(curr, 'currency')}
    onCostChange={(val) => setter(val, 'cost')}
    onPaymentLinkChange={(link) => {
      if (showPaymentError) showPaymentError = false;
      setter(link, 'metadata.paymentLink');
    }}
    onShowDiscountChange={(checked) => setter(checked, 'metadata.showDiscount')}
    onDiscountChange={(val) => setter(val, 'metadata.discount')}
    onGiftToggleChange={(checked) => setter(checked, 'metadata.reward.show')}
    onRewardDescriptionChange={(content) => setter(content, 'metadata.reward.description')}
  />
{/if}
