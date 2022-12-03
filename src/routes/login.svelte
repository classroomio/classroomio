<script context="module">
  export function preload(page, { config }) {
    return { config };
  }
</script>

<script>
  import { goto } from '@sapper/app';
  import TextField from '../components/Form/TextField.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import { getSupabase } from '../utils/functions/supabase';
  import { authValidation } from '../utils/functions/validator';
  import { ROUTE } from '../utils/constants/routes';
  import { LOGIN_FIELDS } from '../utils/constants/authentication';
  import AuthUI from '../components/AuthUI/index.svelte';

  export let config;

  let formRef;
  let supabase = getSupabase(config);
  let fields = Object.assign({}, LOGIN_FIELDS);
  let submitError;
  let loading = false;
  let success = false;
  let errors = {};

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.signIn({
        email: fields.email,
        password: fields.password,
      });
      console.log('data', data);
      if (error) throw error;

      success = true;
      return goto(ROUTE.DASHBOARD);
    } catch (error) {
      submitError = error.error_description || error.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome back to ClassroomIO</title>
</svelte:head>

<AuthUI
  {supabase}
  isLogin={true}
  {handleSubmit}
  showOnlyContent={loading}
  bind:formRef
>
  <div class="mt-4 w-full">
    <p class="text-lg font-semibold mb-6">Welcome back</p>
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
    <TextField
      label="Your password"
      bind:value={fields.password}
      type="password"
      placeholder="************"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={loading}
      errorMessage={errors.password}
    />
    {#if submitError}
      <p class="text-sm text-red-500">{submitError}</p>
    {/if}
    <div class="w-full text-right">
      <a class="text-md text-blue-700" href="/forgot"> Forgot password? </a>
    </div>
  </div>

  <div class="my-4 w-full flex justify-end items-center">
    <!-- <a href="/login" class="text-blue-700 text-sm">Create an account</a> -->
    <PrimaryButton
      label="Log In"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
