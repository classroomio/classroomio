<script>
  import { goto } from '$app/navigation';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import {
    authValidation,
    getConfirmPasswordError,
    getDisableSubmit
  } from '$lib/utils/functions/validator';
  import { SIGNUP_FIELDS } from '$lib/utils/constants/authentication';
  import AuthUI from '$lib/components/AuthUI/index.svelte';

  let supabase = getSupabase();
  let fields = Object.assign({}, SIGNUP_FIELDS);
  let loading = false;
  let success = false;
  let errors = {};
  let submitError;
  let disableSubmit = false;
  let formRef;

  async function handleSubmit(e) {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password
      });
      console.log('data', data);
      if (error) throw error;

      formRef?.reset();

      return goto('/login');
      // success = true;
      // fields = Object.assign({}, SIGNUP_FIELDS);
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

<AuthUI {supabase} isLogin={false} {handleSubmit} isLoading={loading} bind:formRef>
  <div class="mt-4 w-full">
    <p class="dark:text-white text-lg font-semibold mb-6">Create a free account</p>
    <!-- <TextField
      label="Full Name"
      bind:value={fields.name}
      type="text"
      autoFocus={true}
      placeholder="e.g Joke Silva"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.name}
      isRequired
    /> -->
    <TextField
      label="Your Email"
      bind:value={fields.email}
      type="email"
      placeholder="you@domain.com"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.email}
      isRequired
    />
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
      label="Create Account"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
