<script>
  import { page } from '$app/stores';
  import TextField from '$lib/components/Form/TextField.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { authValidation } from '$lib/utils/functions/validator';
  import { LOGIN_FIELDS } from '$lib/utils/constants/authentication';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';

  let formRef;
  let supabase = getSupabase();
  let fields = Object.assign({}, LOGIN_FIELDS);
  let submitError;
  let loading = false;
  let errors = {};

  let query = new URLSearchParams($page.url.search);
  let redirect = query.get('redirect');

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: fields.email,
        password: fields.password
      });
      console.log('data', data);
      if (error) throw error;

      // reload page on org site cause for some reason the authlistener on +layout.svelte doesn't run
      // on org site
      if ($currentOrg.id && redirect) {
        console.log('Forcing full page reload for auth listener');
        window.location.reload();
      }
    } catch (error) {
      submitError = error.error_description || error.message;
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome back to {$currentOrg.name ?? 'ClassroomIO'}</title>
</svelte:head>

<AuthUI {supabase} isLogin={true} {handleSubmit} isLoading={loading} bind:formRef>
  <div class="mt-4 w-full">
    <p class="dark:text-white text-lg font-semibold mb-6">Welcome back</p>
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
      <a class="text-md text-primary-700" href="/forgot"> Forgot password? </a>
    </div>
  </div>

  <div class="my-4 w-full flex justify-end items-center">
    <!-- <a href="/login" class="text-primary-700 text-sm">Create an account</a> -->
    <PrimaryButton
      label="Log In"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
