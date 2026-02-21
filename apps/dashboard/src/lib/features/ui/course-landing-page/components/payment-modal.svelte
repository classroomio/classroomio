<script lang="ts">
  import { preventDefault } from '$lib/utils/functions/svelte';
  import { coursePaymentValidation } from '$lib/utils/functions/validator';
  import { courseApi } from '$features/course/api/course.svelte';

  import * as Dialog from '@cio/ui/base/dialog';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    open?: boolean;
    paymentLink?: string;
    courseId?: string;
  }

  let { open = $bindable(false), paymentLink = '', courseId = '' }: Props = $props();

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
    STEP_2: 'GO_TO_PAYMENT'
  };

  let step = $state(STEPS.STEP_1);

  async function onSubmit() {
    errors = coursePaymentValidation(fields);
    console.log('coursePayment errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    if (paymentLink && courseId) {
      step = STEPS.STEP_2;

      // Send payment request emails via backend
      await courseApi.createPaymentRequest(courseId, fields.email, fields.fullname);
    } else {
      open = false;
    }
  }

  function onClickPaymentLink() {
    fields.fullname = '';
    fields.email = '';
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-96">
    <Dialog.Header>
      <Dialog.Title>Process course payment</Dialog.Title>
    </Dialog.Header>
    {#if step === STEPS.STEP_1}
      <form onsubmit={preventDefault(onSubmit)}>
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
        <a href={paymentLink} target="_blank" onclick={onClickPaymentLink} class="text-sm font-semibold"
          >Go to payment</a
        >
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
