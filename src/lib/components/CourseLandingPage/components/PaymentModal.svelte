<script lang="ts">
  import TextField from '$lib/components/Form/TextField.svelte';
  import Modal from '$lib/components/Modal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { coursePaymentValidation } from '$lib/utils/functions/validator';
  import { Link } from 'carbon-components-svelte';
  import { sendTeacherStudentJoinRequest, sendStudentRequestReceipt } from './utils';
  import { currentOrg } from '$lib/utils/store/org';

  export let open = false;
  export let paymentLink = '';
  export let teacherEmail = '';
  export let courseName = '';

  let fields = {
    fullname: '',
    email: ''
  };

  let errors = {
    fullname: '',
    email: ''
  };

  const STEPS = {
    STEP_1: 'ENTER_DETAILS',
    STEP_2: 'GO_TO_PAYMENT'
  };

  let step = STEPS.STEP_1;

  function onSubmit() {
    errors = coursePaymentValidation(fields);
    console.log('coursePayment errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    if (paymentLink) {
      step = STEPS.STEP_2;

      // Send email to first added teacher of student wanting to join
      sendTeacherStudentJoinRequest({
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
    sendStudentRequestReceipt({
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
</script>

<Modal onClose={() => (open = false)} bind:open width="w-96" modalHeading="Process course payment">
  {#if step === STEPS.STEP_1}
    <form on:submit|preventDefault={onSubmit}>
      <TextField
        label="Your Fullname"
        bind:value={fields.fullname}
        autoFocus={true}
        placeholder="John Doe"
        className="mb-4"
        isRequired={true}
        autoComplete={false}
        errorMessage={errors.fullname}
      />
      <TextField
        label="Your Fullname"
        bind:value={fields.email}
        placeholder="johndoe@email.com"
        className="mb-4"
        isRequired={true}
        autoComplete={false}
        errorMessage={errors.email}
      />

      <div class="mt-5 flex items-center flex-row-reverse">
        <PrimaryButton
          className="px-6 py-3"
          label={paymentLink ? 'Next' : 'Finish'}
          type="submit"
        />
      </div>
    </form>
  {:else if step === STEPS.STEP_2}
    <p>
      You will now be taken to a payment page, once you've paid send a proof of payment to the
      course admin
    </p>
    <div class="mt-5 flex items-center flex-row-reverse">
      <Link href={paymentLink} target="_blank" on:click={onClickPaymentLink}>Go to payment</Link>
    </div>
  {/if}
</Modal>
