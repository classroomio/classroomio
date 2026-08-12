<script lang="ts">
  import * as z from 'zod';
  import get from 'lodash/get';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import { Label } from '@cio/ui/base/label';

  import type { Course } from '$features/course/utils/types';
  import { t } from '$lib/utils/functions/translations';
  import { isCoursePaid } from '$lib/utils/functions/course';
  import { toFiniteNumber } from '@cio/utils/functions';

  import { InputField } from '@cio/ui/custom/input-field';
  import { TextEditor } from '$features/ui';

  interface Props {
    course: Course;
    setter: (value: any, key: string) => void;
  }

  let { course = $bindable(), setter }: Props = $props();

  let paymentLink = $derived(get(course, 'metadata.paymentLink', '') ?? '');
  let isPaid = $derived(isCoursePaid(course));
  let showDiscount = $derived(Boolean(get(course, 'metadata.showDiscount', false)));
  let discount = $derived(toFiniteNumber(get(course, 'metadata.discount', 0)) ?? 0);
  let giftToggled = $derived(Boolean(get(course, 'metadata.reward.show', false)));

  let paymentLinkError = $state('');

  const ZPaymentUrl = z.url();

  function validatePaymentLink(value: string): string {
    if (!value.trim()) return '';

    const result = ZPaymentUrl.safeParse(value.trim());

    if (!result.success) {
      return t.get('course.navItem.landing_page.editor.pricing_form.payment_invalid_url');
    }

    return '';
  }

  const paymentLinkErrorMessage = $derived.by(() => {
    // Inline error from typing takes priority
    if (paymentLinkError) return paymentLinkError;

    if (!showPaymentError) return '';

    const trimmed = paymentLink.trim();

    if (!trimmed) {
      return t.get('course.navItem.landing_page.editor.pricing_form.payment_required');
    }

    if (!ZPaymentUrl.safeParse(trimmed).success) {
      return t.get('course.navItem.landing_page.editor.pricing_form.payment_invalid_url');
    }

    return '';
  });

  function handlePaymentLinkChange(value: string) {
    paymentLinkError = validatePaymentLink(value);
    if (!paymentLinkError) showPaymentError = false;
    setter(value, 'metadata.paymentLink');
  }

  function handlePaidChange(checked: boolean) {
    setter(checked, 'metadata.isPaid');
    if (!checked) {
      paymentLinkError = '';
    }
  }

  function handleChange(content: string) {
    setter(content, 'metadata.reward.description');
  }

  $effect(() => {
    setter(showDiscount, 'metadata.showDiscount');
  });
  $effect(() => {
    setter(paymentLink, 'metadata.paymentLink');
  });
  $effect(() => {
    setter(toFiniteNumber(discount) ?? 0, 'metadata.discount');
  });
  $effect(() => {
    setter(giftToggled, 'metadata.reward.show');
  });
</script>

{#if typeof course !== 'undefined'}
  <div>
    <div class="mb-2">
      <Label class="font-bold">{$t('course.navItem.landing_page.editor.pricing_form.enable_paid')}</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch checked={isPaid} onCheckedChange={handlePaidChange} />
      <Label class="text-gray-600">
        {isPaid
          ? $t('course.navItem.landing_page.editor.pricing_form.yes')
          : $t('course.navItem.landing_page.editor.pricing_form.no')}
      </Label>
    </div>
  </div>

  {#if isPaid}
    <div class="mt-5">
      <Label class="mb-2 font-bold">{$t('course.navItem.landing_page.editor.pricing_form.currency')}</Label>
      <Select.Root type="single" value={course.currency} onValueChange={(value) => setter(value, 'currency')}>
        <Select.Trigger class="w-full">
          <p>{course.currency === 'NGN' ? 'NGN' : 'USD'}</p>
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="NGN">NGN</Select.Item>
          <Select.Item value="USD">USD</Select.Item>
        </Select.Content>
      </Select.Root>
    </div>

    <InputField
      className="mt-5"
      labelClassName="font-bold"
      label={$t('course.navItem.landing_page.editor.pricing_form.cost')}
      type="number"
      bind:value={course.cost}
    />

    {#if !!(course.cost && course.cost > 0)}
      <InputField
        className="mt-5"
        labelClassName="font-bold"
        label={$t('course.navItem.landing_page.editor.pricing_form.payment')}
        helperMessage="Stripe, Lemon Squeezy or any payment link"
        isRequired
        errorMessage={paymentLinkErrorMessage}
        bind:value={paymentLink}
        onchange={(e) => handlePaymentLinkChange(e.currentTarget.value)}
      />
    {/if}
  {/if}

  <div class="mt-5">
    <div class="mb-2">
      <Label class="font-bold">{$t('course.navItem.landing_page.editor.pricing_form.discount')}</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch bind:checked={showDiscount} />
      <Label class="text-gray-600">
        {showDiscount
          ? $t('course.navItem.landing_page.editor.pricing_form.yes')
          : $t('course.navItem.landing_page.editor.pricing_form.no')}
      </Label>
    </div>
  </div>

  {#if showDiscount}
    <InputField
      className="mt-5"
      labelClassName="font-bold"
      label={$t('course.navItem.landing_page.editor.pricing_form.percent')}
      type="number"
      bind:value={discount}
      helperMessage="In Percentage %"
    />
  {/if}

  <div class="mt-5">
    <div class="mb-2">
      <Label class="font-bold">Gift on Completion</Label>
    </div>
    <div class="flex items-center space-x-2">
      <Switch bind:checked={giftToggled} />

      <Label class="text-gray-600">
        {giftToggled
          ? $t('course.navItem.landing_page.editor.pricing_form.yes')
          : $t('course.navItem.landing_page.editor.pricing_form.no')}
      </Label>
    </div>
  </div>

  {#if giftToggled}
    <p class="mt-5 dark:text-white">
      {$t('course.navItem.landing_page.editor.pricing_form.gift')}
    </p>

    <div class="h-2/5">
      <TextEditor
        content={get(course, 'metadata.reward.description', '')}
        onChange={(content) => handleChange(content)}
      />
    </div>
  {/if}
{/if}
