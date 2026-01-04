<script lang="ts">
  import { currentOrg } from '$lib/utils/store/org';
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { coursePaymentValidation } from '$lib/utils/functions/validator';
  import { triggerSendEmail, NOTIFICATION_NAME } from '$lib/utils/services/notification/notification';
  import { paymentsApi } from '$features/payments';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';
  import { Loader2 } from 'lucide-svelte';

  interface Props {
    open?: boolean;
    paymentLink?: string;
    teacherEmail?: string;
    courseName?: string;
    courseId?: string;
    useIntegratedPayment?: boolean;
  }

  let {
    open = $bindable(false),
    paymentLink = '',
    teacherEmail = '',
    courseName = '',
    courseId = '',
    useIntegratedPayment = false
  }: Props = $props();

  let fields = $state({
    fullname: '',
    email: ''
  });

  let errors: Record<string, string> = $state({
    fullname: '',
    email: ''
  });

  const STEPS = {
    STEP_1: 'ENTER_DETAILS',
    STEP_2: 'GO_TO_PAYMENT',
    STEP_3: 'PROCESSING'
  };

  let step = $state(STEPS.STEP_1);

  async function onSubmit() {
    errors = coursePaymentValidation(fields);
    console.log('coursePayment errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    // Use integrated payment if enabled and courseId is available
    if (useIntegratedPayment && courseId) {
      step = STEPS.STEP_3;

      const baseUrl = $page.url.origin;
      const successUrl = `${baseUrl}/courses/${courseId}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/courses/${courseId}/payment-cancelled`;

      const result = await paymentsApi.createCheckout({
        courseId,
        customerEmail: fields.email,
        customerName: fields.fullname,
        successUrl,
        cancelUrl
      });

      if (result?.checkoutUrl) {
        // Redirect to payment provider's checkout page
        window.location.href = result.checkoutUrl;
      } else {
        // Error occurred, show error
        step = STEPS.STEP_1;
        errors.general = paymentsApi.errors.general || 'Failed to create checkout session';
      }
      return;
    }

    // Fallback to external payment link flow
    if (paymentLink) {
      step = STEPS.STEP_2;

      // Send email to first added teacher of student wanting to join
      triggerSendEmail(NOTIFICATION_NAME.SEND_TEACHER_STUDENT_BUY_REQUEST, {
        to: teacherEmail,
        courseName,
        studentEmail: fields.email,
        studentFullname: fields.fullname
      });
    } else {
      open = false;
    }
  }

  function onClickPaymentLink() {
    // Send email to student to send proof of payment to teacher
    triggerSendEmail(NOTIFICATION_NAME.STUDENT_PROOVE_COURSE_PAYMENT, {
      to: fields.email,
      courseName,
      teacherEmail,
      studentFullname: fields.fullname,
      orgName: $currentOrg.name
    });

    fields.fullname = '';
    fields.email = '';
    open = false;
  }

  function resetModal() {
    step = STEPS.STEP_1;
    fields = { fullname: '', email: '' };
    errors = {};
    paymentsApi.reset();
  }

  // Reset when modal closes
  $effect(() => {
    if (!open) {
      resetModal();
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>Process course payment</Dialog.Title>
    </Dialog.Header>
    {#if step === STEPS.STEP_1}
      <form onsubmit={preventDefault(onSubmit)}>
        {#if errors.general}
          <div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {errors.general}
          </div>
        {/if}
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
          <Button type="submit" disabled={paymentsApi.isLoading}>
            {#if paymentsApi.isLoading}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Processing...
            {:else}
              {paymentLink || useIntegratedPayment ? 'Continue to Payment' : 'Finish'}
            {/if}
          </Button>
        </div>
      </form>
    {:else if step === STEPS.STEP_2}
      <p>You will now be taken to a payment page, once you've paid send a proof of payment to the course admin</p>
      <div class="mt-5 flex flex-row-reverse items-center">
        <a href={paymentLink} target="_blank" onclick={onClickPaymentLink} class="text-sm font-semibold"
          >Go to payment</a
        >
      </div>
    {:else if step === STEPS.STEP_3}
      <div class="flex flex-col items-center justify-center py-8">
        <Loader2 class="mb-4 h-8 w-8 animate-spin text-primary" />
        <p class="text-center text-gray-600 dark:text-gray-400">
          Preparing your secure checkout...
        </p>
        <p class="mt-2 text-center text-sm text-gray-500 dark:text-gray-500">
          You'll be redirected to our payment provider shortly.
        </p>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
