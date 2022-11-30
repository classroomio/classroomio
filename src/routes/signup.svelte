<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { goto } from '@sapper/app';
  import { Chasing } from 'svelte-loading-spinners';
  import TextField from '../components/Form/TextField.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { getSupabase } from '../utils/functions/supabase';
  import { user } from '../utils/store/user';
  import {
    signUpValidation,
    getConfirmPasswordError,
    getDisableSubmit,
  } from '../utils/functions/validator';
  import { SIGNUP_FIELDS } from '../utils/constants/authentication';
  import AuthUI from '../components/AuthUI/index.svelte';
  import EmailSentIcon from '../components/Icons/EmailSentIcon.svelte';

  export let config;

  let supabase = getSupabase(config);
  let fields = Object.assign({}, SIGNUP_FIELDS);
  let loading = false;
  let success = false;
  let errors = {};
  let submitError;
  let disableSubmit = false;

  async function handleSubmit() {
    const validationRes = signUpValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password,
        options: {
          data: {
            fullname: fields.name,
          },
        },
      });
      if (error) throw error;

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
  <title>Sign Up - ClassroomIO</title>
</svelte:head>

<AuthUI {supabase} isLogin={false} {handleSubmit} showOnlyContent={success}>
  <div class="mt-4 w-full">
    {#if $user.fetchingUser}
      <div class="h-40 text-md flex items-center justify-center">
        <Chasing size="60" color="#ff3e00" unit="px" duration="1s" />
      </div>
    {:else if success}
      <div class="text-md flex items-center justify-center flex-col">
        <EmailSentIcon />
        <h2 class="text-xl">Email sent!</h2>
        <p class="mt-4 text-center">
          We have sent a confirmation email to {fields.email}. Please check both
          your
          <strong>spam </strong>and your<strong>&nbsp; inbox</strong>.
        </p>
      </div>
    {:else}
      <p class="text-lg font-semibold mb-6">Create a free account</p>
      <TextField
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
      />
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
      <div class="w-full text-right">
        <a class="text-md text-blue-700" href="/forgot"> Forgot password? </a>
      </div>
    {/if}
  </div>

  {#if !success}
    <div class="my-4 w-full flex justify-end items-center">
      <PrimaryButton
        label={loading ? 'Creating...' : 'Create Account'}
        type="submit"
        className="py-3 sm:w-full w-full"
        isDisabled={disableSubmit || loading}
      />
    </div>
  {/if}
</AuthUI>
