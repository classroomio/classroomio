<script lang="ts">
  /* features/ui/course-landing-page/components/payment-modal.svelte: the paid course "Enroll" dialog */
  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { t } from './copy';

  interface Props {
    open?: boolean;
    paymentLink?: string;
    courseId?: string;
    onPaymentRequest?: (details: { fullname: string; email: string }) => void;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(false), paymentLink = '', courseId = '', onPaymentRequest = () => {}, onOpenChange = () => {} }: Props = $props();

  const fields = $state({ fullname: '', email: '' });
  const errors = $state({ fullname: '', email: '' });

  const STEPS = { STEP_1: 'ENTER_DETAILS', STEP_2: 'GO_TO_PAYMENT' };
  let step = $state(STEPS.STEP_1);

  function resetForm() {
    step = STEPS.STEP_1;
    fields.fullname = '';
    fields.email = '';
    errors.fullname = '';
    errors.email = '';
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    onOpenChange(isOpen);
    onOpenChange(isOpen);

    if (!isOpen) resetForm();
  }

  function validate() {
    errors.fullname = fields.fullname.length >= 6 ? '' : t('validations.course_payment.full_name.min_char');
    errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)
      ? ''
      : t('validations.course_payment.email.invalid_email');

    return !errors.fullname && !errors.email;
  }

  function onSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!validate()) return;

    onPaymentRequest({ fullname: fields.fullname, email: fields.email });

    if (paymentLink && courseId) {
      step = STEPS.STEP_2;
    } else {
      handleOpenChange(false);
    }
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>Process course payment</Dialog.Title>
    </Dialog.Header>
    {#if step === STEPS.STEP_1}
      <form onsubmit={onSubmit}>
        <InputField
          label="Your Fullname"
          bind:value={fields.fullname}
          autoFocus={true}
          placeholder="John Doe"
          className="mb-4"
          isRequired={true}
          autoComplete={false}
          errorMessage={errors.fullname}
        />
        <InputField
          label="Your Email"
          bind:value={fields.email}
          placeholder="johndoe@email.com"
          className="mb-4"
          isRequired={true}
          autoComplete={false}
          errorMessage={errors.email}
        />

        <div class="mt-5 flex flex-row-reverse items-center">
          <Button type="submit">
            {paymentLink ? 'Next' : 'Finish'}
          </Button>
        </div>
      </form>
    {:else if step === STEPS.STEP_2}
      <p>You will now be taken to a payment page, once you've paid send a proof of payment to the course admin</p>
      <div class="mt-5 flex flex-row-reverse items-center">
        <a href={paymentLink} target="_blank" rel="noopener" onclick={() => handleOpenChange(false)} class="text-sm font-semibold"
          >Go to payment</a
        >
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
