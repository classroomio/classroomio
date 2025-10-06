<script>
  import { goto } from '$app/navigation';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import {
    resetValidation,
    getConfirmPasswordError,
    getDisableSubmit
  } from '$lib/utils/functions/validator';
  import { RESET_FIELDS } from '$lib/utils/constants/authentication';
  import AuthUI from '$lib/components/AuthUI/index.svelte';

  let supabase = getSupabase();
  let fields = $state(Object.assign({}, RESET_FIELDS));
  let loading = $state(false);
  let success = false;
  let errors = $state({});
  let submitError = $state();
  let disableSubmit = $state(false);
  let formRef = $state();

  async function handleSubmit(e) {
    errors = resetValidation(fields);
    console.log('errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.updateUser({
        password: fields.password
      });
      console.log('data', data);
      if (error) throw error;

      formRef?.reset();

      return goto('/login');
    } catch (error) {
      submitError = error.error_description || error.message;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    errors.confirmPassword = getConfirmPasswordError(fields);
  });
  $effect(() => {
    disableSubmit = getDisableSubmit(fields);
  });
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<AuthUI
  {supabase}
  isLogin={false}
  {handleSubmit}
  showOnlyContent={true}
  isLoading={loading}
  showLogo={true}
  bind:formRef
>
  <div class="mt-4 w-full">
    <h3 class="my-3 text-xl font-semibold dark:text-white">New Password</h3>
    <p class="mb-6 text-sm dark:text-white">Enter your new password details</p>
    <TextField
      label="Your Password"
      bind:value={fields.password}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.password}
      helperMessage="Password must be more than 6 characters"
      isRequired
    />
    <TextField
      label="Confirm Password"
      bind:value={fields.confirmPassword}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.confirmPassword}
      isRequired
    />
    {#if submitError}
      <p class="text-sm text-red-500">{submitError}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-end">
    <PrimaryButton
      label="Reset Password"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
