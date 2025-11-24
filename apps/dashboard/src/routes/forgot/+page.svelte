<script lang="ts">
  import { goto } from '$app/navigation';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { ROUTE } from '$lib/utils/constants/routes';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import EmailSentIcon from '$lib/components/Icons/EmailSentIcon.svelte';
  import { forgotApi } from '$lib/features/auth/api/forgot.svelte';
  import type { TForgotPasswordForm } from '$lib/features/auth/utils/types';

  let fields: TForgotPasswordForm = $state({ email: '' });
</script>

<svelte:head>
  <title>Forgot Password - ClassroomIO</title>
</svelte:head>

<AuthUI handleSubmit={() => forgotApi.submit(fields)} showOnlyContent={true} showLogo={!forgotApi.success}>
  {#if forgotApi.success}
    <div class="mt-4 flex w-full flex-col items-center justify-center">
      <EmailSentIcon />
      <h3 class="my-3 text-xl font-semibold dark:text-white">Email Sent!</h3>
      <p class="text-md mb-6 text-center dark:text-white">
        We have sent a confirmation email to <span class="text-primary-700">{fields.email}</span>. Kindly check your
        inbox to reset password or spam to reset your password.
      </p>
    </div>

    <div class="my-4 flex w-full flex-col items-center justify-end">
      <PrimaryButton label="Okay" type="button" className="sm:w-full w-full mb-4" onClick={() => goto(ROUTE.LOGIN)} />
    </div>
  {:else}
    <div class="mt-4 w-full">
      <h3 class="my-3 text-xl font-semibold dark:text-white">Forgot Password</h3>
      <p class="mb-6 text-sm dark:text-white">We will send you a reset link to your email</p>
      <TextField
        label="Your email"
        bind:value={fields.email}
        type="email"
        autoFocus={true}
        placeholder="you@domain.com"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={forgotApi.isLoading}
        errorMessage={forgotApi.errors.email}
      />
    </div>

    <div class="my-4 flex w-full flex-col items-center justify-end">
      <PrimaryButton
        label="Reset Password"
        type="submit"
        className="sm:w-full w-full mb-4"
        isLoading={forgotApi.isLoading}
      />
      <PrimaryButton
        label="Cancel"
        type="button"
        className="sm:w-full w-full text-primary-700"
        variant={VARIANTS.NONE}
        onClick={() => goto(ROUTE.LOGIN)}
      />
    </div>
  {/if}
</AuthUI>
