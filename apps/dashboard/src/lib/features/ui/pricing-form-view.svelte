<script lang="ts">
  import * as Select from '@cio/ui/base/select';
  import * as Field from '@cio/ui/base/field';
  import { Switch } from '@cio/ui/base/switch';
  import { ZPaymentLink } from '@cio/utils/validation/course';

  import { t } from '$lib/utils/functions/translations';
  import { normalizeIntegerInput } from '@cio/utils/functions';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextEditor } from '$features/ui';

  interface Props {
    isPaid: boolean;
    currency: string;
    cost: number;
    paymentLink: string;
    showDiscount: boolean;
    discount: number;
    giftToggled: boolean;
    rewardDescription?: string;
    showPaymentError?: boolean;
    paymentRequiredError?: string;
    paymentInvalidUrlError?: string;
    paymentHelperMessage?: string;
    percentageHelperMessage?: string;
    onPaidChange: (checked: boolean) => void;
    onCurrencyChange: (currency: string) => void;
    onCostChange: (cost: number) => void;
    onPaymentLinkChange: (link: string) => void;
    onShowDiscountChange: (checked: boolean) => void;
    onDiscountChange: (discount: number) => void;
    onGiftToggleChange: (checked: boolean) => void;
    onRewardDescriptionChange: (content: string) => void;
  }

  let {
    isPaid,
    currency,
    cost,
    paymentLink,
    showDiscount,
    discount,
    giftToggled,
    rewardDescription = '',
    showPaymentError = false,
    paymentRequiredError,
    paymentInvalidUrlError,
    paymentHelperMessage,
    percentageHelperMessage,
    onPaidChange,
    onCurrencyChange,
    onCostChange,
    onPaymentLinkChange,
    onShowDiscountChange,
    onDiscountChange,
    onGiftToggleChange,
    onRewardDescriptionChange
  }: Props = $props();

  let paymentLinkError = $state('');

  // Raw text while typing cost/discount. Intermediate keystrokes (decimals,
  // clearing the field) are never force-rewritten; the normalized number
  // commits on blur so the input always shows what will be saved.
  let costDraft = $state<string | null>(null);
  let discountDraft = $state<string | null>(null);

  // Drop stale drafts when committed values change externally (e.g. path switch).
  $effect(() => {
    void cost;
    costDraft = null;
  });
  $effect(() => {
    void discount;
    discountDraft = null;
  });

  function commitCost() {
    if (costDraft === null) return;

    const normalized = normalizeIntegerInput(costDraft);
    costDraft = null;

    if (normalized !== cost) onCostChange(normalized);
  }

  function commitDiscount() {
    if (discountDraft === null) return;

    const normalized = normalizeIntegerInput(discountDraft, 0, 100);
    discountDraft = null;

    if (normalized !== discount) onDiscountChange(normalized);
  }

  function validatePaymentLink(value: string): string {
    if (!value.trim()) return '';

    const result = ZPaymentLink.safeParse(value.trim());

    if (!result.success) {
      return paymentInvalidUrlError ?? t.get('common.pricing.payment_invalid_url');
    }

    return '';
  }

  const paymentLinkErrorMessage = $derived.by(() => {
    if (paymentLinkError) return paymentLinkError;

    if (!showPaymentError) return '';

    const trimmed = (paymentLink ?? '').trim();

    if (!trimmed) {
      return paymentRequiredError ?? t.get('common.pricing.payment_required');
    }

    if (!ZPaymentLink.safeParse(trimmed).success) {
      return paymentInvalidUrlError ?? t.get('common.pricing.payment_invalid_url');
    }

    return '';
  });

  function handlePaymentLinkInput(val: string) {
    paymentLinkError = validatePaymentLink(val);
    onPaymentLinkChange(val);
  }

  function handlePaidToggle(checked: boolean) {
    if (!checked) {
      paymentLinkError = '';
    }
    onPaidChange(checked);
  }
</script>

<Field.Group>
  <Field.Set>
    <Field.Legend>{$t('common.pricing.enable_paid')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch checked={isPaid} onCheckedChange={handlePaidToggle} />
      <Field.Label>
        {isPaid ? $t('common.pricing.yes') : $t('common.pricing.no')}
      </Field.Label>
    </Field.Field>

    {#if isPaid}
      <Field.Group>
        <Field.Field>
          <Field.Label>{$t('common.pricing.currency')}</Field.Label>
          <Select.Root type="single" value={currency} onValueChange={onCurrencyChange}>
            <Select.Trigger class="w-full">
              <p>{currency}</p>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="NGN">NGN</Select.Item>
              <Select.Item value="USD">USD</Select.Item>
            </Select.Content>
          </Select.Root>
        </Field.Field>

        <Field.Field>
          <InputField
            label={$t('common.pricing.cost')}
            type="number"
            min={0}
            step={1}
            value={costDraft ?? cost}
            oninput={(e) => {
              costDraft = (e.currentTarget as HTMLInputElement).value;
            }}
            onchange={commitCost}
          />
        </Field.Field>

        <Field.Field>
          <InputField
            label={$t('common.pricing.payment_link')}
            helperMessage={paymentHelperMessage}
            isRequired
            errorMessage={paymentLinkErrorMessage}
            value={paymentLink}
            oninput={(e) => handlePaymentLinkInput((e.currentTarget as HTMLInputElement).value)}
          />
        </Field.Field>
      </Field.Group>
    {/if}
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('common.pricing.discount')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch checked={showDiscount} onCheckedChange={onShowDiscountChange} />
      <Field.Label>
        {showDiscount ? $t('common.pricing.yes') : $t('common.pricing.no')}
      </Field.Label>
    </Field.Field>

    {#if showDiscount}
      <Field.Group>
        <Field.Field>
          <InputField
            label={$t('common.pricing.discount_percentage')}
            type="number"
            min={0}
            max={100}
            step={1}
            value={discountDraft ?? discount}
            oninput={(e) => {
              discountDraft = (e.currentTarget as HTMLInputElement).value;
            }}
            onchange={commitDiscount}
            helperMessage={percentageHelperMessage}
          />
        </Field.Field>
      </Field.Group>
    {/if}
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('common.pricing.reward')}</Field.Legend>
    <Field.Field orientation="horizontal">
      <Switch checked={giftToggled} onCheckedChange={onGiftToggleChange} />
      <Field.Label>
        {giftToggled ? $t('common.pricing.yes') : $t('common.pricing.no')}
      </Field.Label>
    </Field.Field>

    {#if giftToggled}
      <Field.Group>
        <Field.Field>
          <Field.Description>
            {$t('common.pricing.reward_help')}
          </Field.Description>
          <div class="h-2/5">
            <TextEditor content={rewardDescription} onChange={onRewardDescriptionChange} />
          </div>
        </Field.Field>
      </Field.Group>
    {/if}
  </Field.Set>
</Field.Group>
