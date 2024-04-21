<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { globalStore } from '$lib/utils/store/app';
  import SenjaEmbed from '$lib/components/Senja/Embed.svelte';

  let supabase = getSupabase();
  let fields = Object.assign({}, SIGNUP_FIELDS);
  let loading = false;
  let success = false;
  let errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  } = {};
  let submitError: string;
  let disableSubmit = false;
  let formRef: HTMLFormElement;

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

      const {
        data: { session },
        error
      } = await supabase.auth.signUp({
        email: fields.email,
        password: fields.password
      });
      console.log('session', session);

      if (error) throw error;

      const { user: authUser } = session || {};
      if (!authUser) {
        throw 'Error creating user';
      }

      if (!$currentOrg.id) return;

      const [regexUsernameMatch] = [...(authUser.email?.matchAll(/(.*)@/g) || [])];
      const response = await fetch('https://api.ipregistry.co/?key=tryout');
      const metadata = await response.json();

      const profileRes = await supabase
        .from('profile')
        .insert({
          id: authUser.id,
          username: regexUsernameMatch[1] + `${new Date().getTime()}`,
          fullname: regexUsernameMatch[1],
          email: authUser.email,
          metadata
        })
        .select();
      console.log('profileRes', profileRes);

      if (profileRes.error) {
        throw profileRes.error;
      }

      // Setting profile
      console.log('setting profile', profileRes.data[0]);
      profile.set(profileRes.data[0]);

      capturePosthogEvent('user_signed_up', {
        distinct_id: $profile.id || '',
        email: authUser.email,
        username: regexUsernameMatch[1],
        metadata
      });

      if ($globalStore.isOrgSite) {
        capturePosthogEvent('student_signed_up', {
          distinct_id: $profile.id || '',
          email: authUser.email,
          username: regexUsernameMatch[1],
          metadata
        });
      }

      if (redirect) {
        goto(redirect);
      } else {
        goto('/login');
      }

      formRef?.reset();
      success = true;
      fields = Object.assign({}, SIGNUP_FIELDS);
    } catch (error) {
      submitError = error?.error_description || error?.message;
      loading = false;
    }
  }

  $: errors.confirmPassword = getConfirmPasswordError(fields);
  $: disableSubmit = getDisableSubmit(fields);
</script>

<svelte:head>
  <title>Join ClassroomIO</title>
</svelte:head>

<SenjaEmbed id="aa054658-1e15-4d00-8920-91f424326c4e" />

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
