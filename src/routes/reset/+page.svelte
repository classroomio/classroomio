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
  let fields = Object.assign({}, RESET_FIELDS);
  let loading = false;
  let success = false;
  let errors = {};
  let submitError;
  let disableSubmit = false;
  let formRef;

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

  $: errors.confirmPassword = getConfirmPasswordError(fields);
  $: disableSubmit = getDisableSubmit(fields);
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
    <h3 class="dark:text-white text-xl font-semibold my-3">New Password</h3>
    <p class="dark:text-white text-sm mb-6">Enter your new password details</p>
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

  <div class="my-4 w-full flex justify-end items-center">
    <PrimaryButton
      label="Reset Password"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
