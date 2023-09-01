<script lang="ts">
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
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import type { CurrentOrg } from '$lib/utils/types/org.js';
  import { onMount } from 'svelte';
  import Error from '../../+error.svelte';

  export let data;

  let supabase = getSupabase();
  let fields = Object.assign({}, SIGNUP_FIELDS);
  let loading = false;

  let errors: {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};

  let submitError: string;
  let disableSubmit = false;
  let formRef: HTMLFormElement;

  async function handleSubmit() {
    const validationRes = authValidation(fields);
    console.log('validationRes', validationRes);

    if (Object.keys(validationRes).length) {
      errors = Object.assign(errors, validationRes);
      return;
    }

    try {
      loading = true;
      // Signup
      const { data: signupData, error } = await supabase.auth.signUp({
        email: data.email,
        password: fields.password
      });

      console.log('Signup', signupData);
      if (error) throw error;

      if (!signupData.user) {
        throw 'User cannot be created ';
      }

      // Insert profile
      const userId = signupData.user.id;
      const profileRes = await supabase
        .from('profile')
        .insert({
          id: userId,
          username: fields.name.toLowerCase().replace(' ', '-') + new Date().getTime(),
          fullname: fields.name,
          email: data.email
        })
        .select();

      console.log('Insert profile', profileRes.data);

      if (profileRes.error) {
        throw profileRes.error;
      }

      const profile = profileRes.data[0] || {};

      if (!profile.id) {
        throw 'Unable to create profile';
      }

      // Update member response
      const updateMemberRes = await supabase
        .from('organizationmember')
        .update({
          verified: true,
          profile_id: profile.id
        })
        .match({ email: data.email, organization_id: data.currentOrg?.id });

      console.log('Update member response', updateMemberRes);
      formRef?.reset();

      return goto('/login');
    } catch (error) {
      if (error instanceof Error) {
        submitError = error.message;
      }
    } finally {
      loading = false;
    }
  }

  function setCurOrg(cOrg: CurrentOrg) {
    if (!cOrg) return;
    currentOrg.set(cOrg);
  }

  onMount(() => {
    setTheme(data.currentOrg?.theme || '');
  });

  $: errors.confirmPassword = getConfirmPasswordError(fields);
  $: disableSubmit = getDisableSubmit(fields);

  $: setCurOrg(data.currentOrg as CurrentOrg);
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<AuthUI
  {supabase}
  isLogin={false}
  {handleSubmit}
  isLoading={loading}
  showOnlyContent={true}
  showLogo={true}
  bind:formRef
>
  <div class="mt-4 w-full">
    <p class="dark:text-white text-lg font-semibold mb-6">Create a free account</p>
    <TextField
      label="Your Email"
      value={data.email}
      type="email"
      placeholder="you@domain.com"
      className="mb-6"
      inputClassName="w-full"
      isDisabled={true}
    />
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
      label="Create and Join"
      type="submit"
      className="sm:w-full w-full"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
