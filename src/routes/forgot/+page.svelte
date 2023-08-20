<script>
  import { goto } from '$app/navigation';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { forgotValidation } from '$lib/utils/functions/validator';
  import { ROUTE } from '$lib/utils/constants/routes';
  import { FORGOT_PASSWORD_FIELDS } from '$lib/utils/constants/authentication';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import EmailSentIcon from '$lib/components/Icons/EmailSentIcon.svelte';

  let supabase = getSupabase();
  let fields = Object.assign({}, FORGOT_PASSWORD_FIELDS);
  let submitError;
  let loading = false;
  let success = false;
  let errors = {};

  async function handleSubmit() {
    errors = forgotValidation(fields);
    console.log('errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.resetPasswordForEmail(fields.email, {
        redirectTo: window.location.origin + ROUTE.RESET
      });
      console.log('data', data);
      if (error) throw error;

      success = true;
    } catch (error) {
      submitError = error.error_description || error.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password - ClassroomIO</title>
</svelte:head>

<AuthUI {supabase} {handleSubmit} showOnlyContent={true} showLogo={!success}>
  {#if success}
    <div class="mt-4 w-full flex items-center justify-center flex-col">
      <EmailSentIcon />
      <h3 class="dark:text-white text-xl font-semibold my-3">Email Sent!</h3>
      <p class="dark:text-white text-md mb-6 text-center">
        We have sent a confirmation email to <span class="text-primary-700">{fields.email}</span>.
        Kindly check your inbox to reset password or spam to reset your password.
      </p>
    </div>

    <div class="my-4 w-full flex justify-end items-center flex-col">
      <PrimaryButton
        label="Okay"
        type="button"
        className="sm:w-full w-full mb-4"
        onClick={() => goto(ROUTE.LOGIN)}
      />
    </div>
  {:else}
    <div class="mt-4 w-full">
      <h3 class="dark:text-white text-xl font-semibold my-3">Forgot Password</h3>
      <p class="dark:text-white text-sm mb-6">We will send you a reset link to your email</p>
      <TextField
        label="Your email"
        bind:value={fields.email}
        type="email"
        autoFocus={true}
        placeholder="you@domain.com"
        className="mb-6"
        inputClassName="w-full"
        isDisabled={loading}
        errorMessage={errors.email}
      />
      {#if submitError}
        <p class="text-sm text-red-500">{submitError}</p>
      {/if}
    </div>

    <div class="my-4 w-full flex justify-end items-center flex-col">
      <PrimaryButton
        label="Reset Password"
        type="submit"
        className="sm:w-full w-full mb-4"
        isDisabled={loading}
        isLoading={loading}
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
